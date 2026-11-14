/**
 * TaskFlow ERP — Excel Workbooks Migration Pipeline
 *
 * Imports historical checklist task templates, occurrences, and delegation tasks
 * from the client's Excel sheets in:
 * E:\FullStack_Domination\d-table-analytics\Langdi-ERP\sheets
 *
 * Features:
 *  - 100% Idempotent (safe to run multiple times with 0 duplicates)
 *  - Automatic User & Department entity resolution with alias dictionary
 *  - Immutable originalDueDate preservation on DelegationTasks
 *  - Revision history preservation into revisions[]
 *  - Rolling window occurrence materialisation for ChecklistTasks
 *  - --dry-run flag for safe validation without writing
 */

const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = require('../config');
const User = require('../modules/auth/models/user.model');
const Department = require('../modules/master/models/department.model');
const Project = require('../modules/master/models/project.model');
const ChecklistTask = require('../modules/checklist/models/checklistTask.model');
const ChecklistOccurrence = require('../modules/checklist/models/checklistOccurrence.model');
const DelegationTask = require('../modules/delegation/models/delegationTask.model');
const { Counter, getNextSequence } = require('../utils/counter');
const {
  toCivilDate,
  civilToday,
  expandOccurrences,
  plannedInstant,
  addDays,
} = require('../utils/recurrence');

const DEFAULT_SHEETS_DIR = 'E:\\FullStack_Domination\\d-table-analytics\\Langdi-ERP\\sheets';
const CHECKLIST_FILE = 'Aug - 2024 Ultimate Checklist v6.1.xlsx';
const DELEGATION_FILE = 'Delegation Sheet v6 New Version.xlsx';

// Frequency code mapping
const FREQ_MAP = {
  D: 'daily',
  W: 'weekly',
  M: 'monthly',
  Q: 'quarterly',
  ELAST: 'lastWeekdayOfMonth',
};

// Aliases for user names across both workbooks
const USER_ALIASES = {
  'sarwan gurjar': 'sharwan gurjar',
  'sharwan gurjar': 'sharwan gurjar',
  'lekhraj langdi': 'lekharaj langdi',
  'lekharaj langdi': 'lekharaj langdi',
  'asharam thekla': 'asharam thekla',
  'asharam gurjar': 'asharam gurjar',
  'devi shay prajapat': 'devi shay prajapat',
  'suresh doi': 'suresh doi',
  'girraj langdi': 'girraj langdi',
  'devraj gurjjar': 'devraj gurjjar',
  'mukesh gurjar': 'mukesh gurjar',
  'rajesh gurjar': 'rajesh gurjar',
  'suresh chechi': 'suresh chechi',
  'ramswroop gurjar': 'ramswroop gurjar',
  'kabir singh': 'kabir singh',
  'shivam sharma': 'shivam sharma',
  'naresh soni': 'naresh soni',
  'bhawani shankar bangar': 'bhawani shankar bangar',
  'manraj langdi': 'manraj langdi',
  'salman khan': 'salman khan',
};

// Canonical directory of known users with defaults
const KNOWN_USERS = {
  'devi shay prajapat': {
    name: 'Devi Shay Prajapat',
    email: 'devilal8559@gmail.com',
    phone: '8559835089',
    department: 'technical',
    role: 'Employee',
  },
  'suresh doi': {
    name: 'Suresh Doi',
    email: 'sureshdoi95@gmail.com',
    phone: '9784000926',
    department: 'accounts',
    role: 'Employee',
  },
  'girraj langdi': {
    name: 'Girraj Langdi',
    email: 'girrajlangdi@gmail.com',
    phone: '9001730798',
    department: 'office_boy',
    role: 'Employee',
  },
  'devraj gurjjar': {
    name: 'Devraj Gurjjar',
    email: 'devrajgurjjar586@gmail.com',
    phone: '6376661396',
    department: 'supervisor',
    role: 'Employee',
  },
  'mukesh gurjar': {
    name: 'Mukesh Gurjar',
    email: 'mukeshgurjar4460@gmail.com',
    phone: '6350212995',
    department: 'supervisor',
    role: 'Employee',
  },
  'rajesh gurjar': {
    name: 'Rajesh Gurjar',
    email: 'rajeshgurrjar2018@gmail.com',
    phone: '9414207708',
    department: 'loan',
    role: 'Employee',
  },
  'suresh chechi': {
    name: 'Suresh Chechi',
    email: 'gurjarchechi5@gmail.com',
    phone: '9649028187',
    department: 'supervisor',
    role: 'Employee',
  },
  'lekharaj langdi': {
    name: 'Lekhraj Langdi',
    email: 'lekhrajgurjar5320@gmail.com',
    phone: '8769594112',
    department: 'project',
    role: 'Employee',
  },
  'asharam thekla': {
    name: 'Asharam Thekla',
    email: 'asharamgurjar8877@gmail.com',
    phone: '9782501634',
    department: 'supervisor',
    role: 'Employee',
  },
  'asharam gurjar': {
    name: 'Asharam Gurjar',
    email: 'ashugurjar821@gmail.com',
    phone: '7792806195',
    department: 'supervisor',
    role: 'Employee',
  },
  'sharwan gurjar': {
    name: 'Sharwan Gurjar',
    email: 'sharvanchawdisharvanchawdi@gmail.com',
    phone: '9571021081',
    department: 'supervisor',
    role: 'Employee',
  },
  'ramswroop gurjar': {
    name: 'Ramswroop Gurjar',
    email: 'ramswrooplangdi@gmail.com',
    phone: '',
    department: 'supervisor',
    role: 'Employee',
  },
  'kabir singh': {
    name: 'Kabir Singh',
    email: 'sk9084903@gmail.com',
    phone: '',
    department: 'sales',
    role: 'Employee',
  },
  'shivam sharma': {
    name: 'Shivam Sharma',
    email: 'shivamsharmajpr76@gmail.com',
    phone: '',
    department: 'sales',
    role: 'Employee',
  },
  'naresh soni': {
    name: 'Naresh Soni',
    email: 'soninaresh9828131352@gmail.com',
    phone: '',
    department: 'sales',
    role: 'Employee',
  },
  'bhawani shankar bangar': {
    name: 'Bhawani Shankar Bangar',
    email: 'bhawani@company.com',
    phone: '9887972554',
    department: 'supervisor',
    role: 'Employee',
  },
  'manraj langdi': {
    name: 'Manraj Langdi',
    email: 'manraj@company.com',
    phone: '9352812958',
    department: 'project',
    role: 'Manager',
  },
  'salman khan': {
    name: 'Salman Khan',
    email: 'salman@company.com',
    phone: '',
    department: 'supervisor',
    role: 'Employee',
  },
};

const DEPARTMENTS_DEF = [
  { name: 'Accounts', key: 'accounts', order: 10 },
  { name: 'Supervisor', key: 'supervisor', order: 20 },
  { name: 'Loan', key: 'loan', order: 30 },
  { name: 'Technical', key: 'technical', order: 40 },
  { name: 'Office Boy', key: 'office_boy', order: 50 },
  { name: 'Sales', key: 'sales', order: 60 },
  { name: 'Project', key: 'project', order: 70 },
];

/**
 * Excel serial number parser
 */
function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    const wholeDays = Math.floor(val);
    const fraction = val - wholeDays;
    const date = new Date(Math.round((wholeDays - 25569) * 86400 * 1000));
    const totalMinutes = Math.round(fraction * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeStr = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    return { date: toCivilDate(date), timeStr: fraction > 0 ? timeStr : '18:00' };
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return { date: toCivilDate(d), timeStr: '18:00' };
}

function parseDoerString(raw) {
  if (!raw) return null;
  const parts = String(raw).split('-').map((s) => s.trim());
  const name = parts[0];
  const phone = parts[1] || '';
  const clean = name.toLowerCase().replace(/\s+/g, ' ').trim();
  const canonical = USER_ALIASES[clean] || clean;
  return { raw, name, phone, canonical };
}

async function runImporter() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log('='.repeat(70));
  console.log(`TaskFlow ERP — Excel Migration Pipeline ${isDryRun ? '[DRY-RUN MODE]' : '[LIVE IMPORT]'}`);
  console.log('='.repeat(70));

  const sheetsDir = process.env.SHEETS_DIR || DEFAULT_SHEETS_DIR;
  const checklistPath = path.join(sheetsDir, CHECKLIST_FILE);
  const delegationPath = path.join(sheetsDir, DELEGATION_FILE);

  if (!fs.existsSync(checklistPath)) {
    throw new Error(`Checklist workbook not found at: ${checklistPath}`);
  }
  if (!fs.existsSync(delegationPath)) {
    throw new Error(`Delegation workbook not found at: ${delegationPath}`);
  }

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || config.mongodbUri;
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);
  console.log(`Connected successfully to database: ${mongoose.connection.name}`);

  // 2. Department setup & cache
  console.log('\n--- Step 1: Ensuring Departments ---');
  const deptMapByKey = new Map();
  const deptMapByName = new Map();
  const deptMapById = new Map();

  for (const def of DEPARTMENTS_DEF) {
    let dept = await Department.findOne({ key: def.key });
    if (!dept && !isDryRun) {
      dept = await Department.create(def);
      console.log(`  + Created Department: ${def.name} (${def.key})`);
    } else if (!dept && isDryRun) {
      dept = { _id: new mongoose.Types.ObjectId(), ...def };
      console.log(`  * [Dry-Run] Would create Department: ${def.name} (${def.key})`);
    }
    if (dept) {
      deptMapByKey.set(def.key, dept);
      deptMapByName.set(def.name.toLowerCase(), dept);
      deptMapById.set(String(dept._id), dept);
    }
  }

  // Also cache any pre-existing departments in DB
  const allExistingDepts = await Department.find();
  for (const d of allExistingDepts) {
    deptMapByKey.set(d.key, d);
    deptMapByName.set(d.name.toLowerCase(), d);
    deptMapById.set(String(d._id), d);
  }

  // 3. User setup & cache
  console.log('\n--- Step 2: Resolving Users ---');
  const userMapByCanonical = new Map();
  const defaultPasswordHash = await bcrypt.hash('Welcome@123', 10);

  // Load existing users from DB
  const existingUsers = await User.find();
  for (const u of existingUsers) {
    const clean = u.name.toLowerCase().replace(/\s+/g, ' ').trim();
    const canon = USER_ALIASES[clean] || clean;
    userMapByCanonical.set(canon, u);
  }

  // Ensure all known users exist
  for (const [canon, info] of Object.entries(KNOWN_USERS)) {
    let user = userMapByCanonical.get(canon);
    const dept = deptMapByKey.get(info.department);

    if (!user) {
      if (!isDryRun) {
        user = await User.create({
          name: info.name,
          email: info.email,
          phone: info.phone,
          role: info.role,
          department: dept ? dept._id : null,
          password: defaultPasswordHash,
          status: 'active',
        });
        console.log(`  + Created User: ${info.name} (${info.email}) [${dept?.name || 'No Dept'}]`);
      } else {
        user = {
          _id: new mongoose.Types.ObjectId(),
          name: info.name,
          email: info.email,
          phone: info.phone,
          role: info.role,
          department: dept ? dept._id : null,
        };
        console.log(`  * [Dry-Run] Would create User: ${info.name} (${info.email})`);
      }
      userMapByCanonical.set(canon, user);
    } else {
      // Update phone or department if missing
      if (!isDryRun && (info.phone && !user.phone || !user.department && dept)) {
        const update = {};
        if (info.phone && !user.phone) update.phone = info.phone;
        if (!user.department && dept) update.department = dept._id;
        await User.findByIdAndUpdate(user._id, update);
      }
    }
  }

  // Default admin / manager for assignedBy
  const defaultCreator =
    userMapByCanonical.get('manraj langdi') ||
    userMapByCanonical.get('devi shay prajapat') ||
    existingUsers.find((u) => u.role === 'Administrator') ||
    existingUsers[0];

  console.log(`  Resolved total users in registry: ${userMapByCanonical.size}`);
  console.log(`  Default Assignor for delegations: ${defaultCreator.name}`);

  // 4. Import Checklist Tasks
  console.log('\n--- Step 3: Importing Checklist Tasks ---');
  const wbChecklist = xlsx.readFile(checklistPath);
  const taskSheet = wbChecklist.Sheets['Task List'];
  const rawTasks = xlsx.utils.sheet_to_json(taskSheet);

  let checklistTasksCreated = 0;
  let checklistTasksExisting = 0;
  let checklistOccurrencesCreated = 0;
  const processedTaskKeys = new Set();

  const existingChecklistTasks = await ChecklistTask.find({ deletedAt: null }).lean();
  const existingTaskMap = new Map();
  for (const t of existingChecklistTasks) {
    existingTaskMap.set(`${t.title.toLowerCase()}||${String(t.assignedTo)}||${t.frequency}`, t);
  }

  for (const row of rawTasks) {
    const rawTitle = (row['Task'] || '').trim();
    if (!rawTitle) continue;

    const doerParsed = parseDoerString(row['Doer Name']);
    if (!doerParsed) continue;

    const user = userMapByCanonical.get(doerParsed.canonical);
    if (!user) {
      console.warn(`  ! Could not resolve user for checklist: ${row['Doer Name']}`);
      continue;
    }

    const freqCode = (row['Frequency'] || '').toUpperCase().trim();
    const frequency = FREQ_MAP[freqCode] || 'daily';

    // Deduplicate identical tasks in the sheet
    const dedupeKey = `${rawTitle.toLowerCase()}||${user._id}||${frequency}`;
    if (processedTaskKeys.has(dedupeKey)) continue;
    processedTaskKeys.add(dedupeKey);

    const parsedDate = parseExcelDate(row['Day/Date']);
    const anchorDate = parsedDate ? parsedDate.date : civilToday();
    const dueTime = parsedDate ? parsedDate.timeStr : '18:00';

    // Department resolution
    let deptId = user.department;
    let deptName = '';
    if (row['Department']) {
      const d = deptMapByName.get(String(row['Department']).toLowerCase().trim());
      if (d) {
        deptId = d._id;
        deptName = d.name;
      }
    }
    if (!deptName && deptId) {
      const d = deptMapById.get(String(deptId));
      if (d) deptName = d.name;
    }

    // Check if task already exists
    let existingTask = existingTaskMap.get(`${rawTitle.toLowerCase()}||${String(user._id)}||${frequency}`);

    if (existingTask) {
      checklistTasksExisting++;
    } else {
      if (!isDryRun) {
        const code = await getNextSequence('checklist_task', 'CHK-', 6);
        const newTask = await ChecklistTask.create({
          code,
          title: rawTitle,
          assignedTo: user._id,
          assignedToName: user.name,
          department: deptId || null,
          departmentName: deptName,
          frequency,
          anchorDate,
          startOn: anchorDate,
          dueTime,
          skipSundays: frequency === 'daily',
          skipHolidays: false,
          active: true,
          createdBy: defaultCreator._id,
        });

        checklistTasksCreated++;

        // Materialise occurrences for next 60 days
        const today = civilToday();
        const horizon = addDays(today, 60);
        const dates = expandOccurrences({
          frequency: newTask.frequency,
          anchorDate: newTask.anchorDate,
          from: today,
          to: horizon,
          startOn: newTask.startOn,
          skipSundays: newTask.skipSundays,
          skipHolidays: newTask.skipHolidays,
        });

        if (dates.length > 0) {
          const ops = dates.map((plannedOn) => ({
            updateOne: {
              filter: { task: newTask._id, plannedOn },
              update: {
                $setOnInsert: {
                  task: newTask._id,
                  title: newTask.title,
                  assignedTo: newTask.assignedTo,
                  assignedToName: newTask.assignedToName,
                  department: newTask.department,
                  departmentName: newTask.departmentName,
                  frequency: newTask.frequency,
                  plannedOn,
                  plannedAt: plannedInstant(plannedOn, newTask.dueTime || '18:00'),
                  status: 'pending',
                },
              },
              upsert: true,
            },
          }));
          const bulkRes = await ChecklistOccurrence.bulkWrite(ops, { ordered: false });
          checklistOccurrencesCreated += bulkRes.upsertedCount || 0;
          await ChecklistTask.findByIdAndUpdate(newTask._id, {
            materialisedThrough: dates[dates.length - 1],
          });
        }
      } else {
        checklistTasksCreated++;
      }
    }
  }

  console.log(`  Checklist Tasks: ${checklistTasksCreated} created, ${checklistTasksExisting} already existed.`);
  console.log(`  Checklist Occurrences Materialised: ${checklistOccurrencesCreated}`);

  // 5. Import Delegation Tasks
  console.log('\n--- Step 4: Importing Delegation Tasks ---');
  const wbDelegation = xlsx.readFile(delegationPath);
  const delSheet = wbDelegation.Sheets['Master'];
  const rawDelegations = xlsx.utils.sheet_to_json(delSheet);

  let delegationsCreated = 0;
  let delegationsUpdated = 0;
  let delegationsSkipped = 0;

  console.log(`  Found ${rawDelegations.length} rows in Delegation Master sheet.`);

  // Load existing delegation legacyCodes
  const existingCodesSet = new Set(
    (await DelegationTask.find({}, { legacyCode: 1, _id: 0 }).lean())
      .map((d) => d.legacyCode)
      .filter(Boolean)
  );

  const BATCH_SIZE = 250;
  let batchOps = [];

  for (let i = 0; i < rawDelegations.length; i++) {
    const row = rawDelegations[i];
    const legacyCode = String(row['Task ID'] || '').trim();
    const rawTitle = String(row['Task'] || '').trim();
    if (!legacyCode || !rawTitle) {
      delegationsSkipped++;
      continue;
    }

    if (existingCodesSet.has(legacyCode)) {
      delegationsSkipped++;
      continue;
    }

    const doerParsed = parseDoerString(row['Name']);
    if (!doerParsed) {
      delegationsSkipped++;
      continue;
    }

    const user = userMapByCanonical.get(doerParsed.canonical);
    if (!user) {
      delegationsSkipped++;
      continue;
    }

    // Dates
    const parsedFirst = parseExcelDate(row['First Date']);
    if (!parsedFirst) {
      delegationsSkipped++;
      continue;
    }
    const originalDueDate = parsedFirst.date;

    const parsedRev1 = parseExcelDate(row['Revision 1']);
    const parsedRev2 = parseExcelDate(row['Revision 2']);
    const parsedLatest = parseExcelDate(row['Latest Revision']);

    // Build revisions array
    const revisions = [];
    if (parsedRev1 && parsedRev1.date.getTime() !== originalDueDate.getTime()) {
      revisions.push({
        fromDate: originalDueDate,
        toDate: parsedRev1.date,
        reason: 'Legacy revision 1 from operational sheet',
        changedBy: defaultCreator._id,
        changedByName: defaultCreator.name,
        changedAt: parsedRev1.date,
        kind: 'revise',
      });
    }

    if (parsedRev2 && (!parsedRev1 || parsedRev2.date.getTime() !== parsedRev1.date.getTime())) {
      revisions.push({
        fromDate: parsedRev1 ? parsedRev1.date : originalDueDate,
        toDate: parsedRev2.date,
        reason: 'Legacy revision 2 from operational sheet',
        changedBy: defaultCreator._id,
        changedByName: defaultCreator.name,
        changedAt: parsedRev2.date,
        kind: 'revise',
      });
    }

    const finalDueDate = parsedLatest
      ? parsedLatest.date
      : parsedRev2
      ? parsedRev2.date
      : parsedRev1
      ? parsedRev1.date
      : originalDueDate;

    // Status mapping
    const rawStatus = String(row['Status'] || '').trim().toLowerCase();
    let status = 'pending';
    let completedAt = null;

    if (rawStatus === 'completed' || rawStatus === 'done') {
      status = 'completed';
      completedAt = finalDueDate;
    } else if (rawStatus === 'week shifted') {
      status = 'weekShifted';
    } else {
      status = 'pending';
    }

    const revisionCount =
      typeof row['Total Revisions'] === 'number'
        ? row['Total Revisions']
        : revisions.length;

    // Resolve user's department
    let deptId = user.department;
    let deptName = '';
    if (deptId) {
      const d = deptMapById.get(String(deptId));
      if (d) deptName = d.name;
    }

    if (!isDryRun) {
      const doc = {
        legacyCode,
        title: rawTitle,
        description: `Imported from legacy Delegation sheet. Original ID: ${legacyCode}`,
        assignedTo: user._id,
        assignedToName: user.name,
        assignedBy: defaultCreator._id,
        assignedByName: defaultCreator.name,
        assignedAt: originalDueDate,
        department: deptId || null,
        departmentName: deptName,
        originalDueDate,
        dueDate: finalDueDate,
        priority: 'medium',
        revisions,
        revisionCount,
        status,
        completedAt,
        completedBy: status === 'completed' ? user._id : null,
        completedByName: status === 'completed' ? user.name : '',
      };

      batchOps.push(doc);

      if (batchOps.length >= BATCH_SIZE) {
        const batchCount = batchOps.length;
        const counter = await Counter.findByIdAndUpdate(
          'delegation_task',
          { $inc: { seq: batchCount } },
          { new: true, upsert: true }
        );
        const endSeq = counter.seq;
        const startSeq = endSeq - batchCount + 1;
        for (let k = 0; k < batchCount; k++) {
          batchOps[k].code = `DLG-${String(startSeq + k).padStart(6, '0')}`;
        }
        await DelegationTask.insertMany(batchOps, { ordered: false });
        delegationsCreated += batchOps.length;
        process.stdout.write(`\r  Progress: ${delegationsCreated} / ${rawDelegations.length} delegations imported...`);
        batchOps = [];
      }
    } else {
      delegationsCreated++;
    }
  }

  // Insert remaining batch
  if (!isDryRun && batchOps.length > 0) {
    const batchCount = batchOps.length;
    const counter = await Counter.findByIdAndUpdate(
      'delegation_task',
      { $inc: { seq: batchCount } },
      { new: true, upsert: true }
    );
    const endSeq = counter.seq;
    const startSeq = endSeq - batchCount + 1;
    for (let k = 0; k < batchCount; k++) {
      batchOps[k].code = `DLG-${String(startSeq + k).padStart(6, '0')}`;
    }
    await DelegationTask.insertMany(batchOps, { ordered: false });
    delegationsCreated += batchOps.length;
  }

  console.log(`\n  Delegations: ${delegationsCreated} created, ${delegationsSkipped} already existed/skipped.`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Mode:                     ${isDryRun ? 'DRY-RUN (No writes)' : 'LIVE EXECUTION'}`);
  console.log(`Departments in DB:        ${await Department.countDocuments()}`);
  console.log(`Users in DB:              ${await User.countDocuments()}`);
  console.log(`Checklist Tasks in DB:    ${await ChecklistTask.countDocuments()}`);
  console.log(`Checklist Occurrences:    ${await ChecklistOccurrence.countDocuments()}`);
  console.log(`Delegation Tasks in DB:   ${await DelegationTask.countDocuments()}`);
  console.log('='.repeat(70));

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Finished successfully.');
}

if (require.main === module) {
  runImporter().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runImporter };
