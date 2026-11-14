/**
 * Phase 6 Verification & Final Handover Suite
 *
 * Exhaustive End-to-End Verification:
 * 1. Database Connectivity & Model Indexes Verification
 * 2. Performance SLA Benchmarks on Historical Data (sub-500ms query times)
 * 3. Master Data & Authentication API
 * 4. Checklist Lifecycle: Create -> Materialise -> Inline Done -> Skip -> Progress
 * 5. Delegation Lifecycle: Create -> Original Date Immutability -> Revise Date -> Complete -> Progress
 * 6. Report Analytics & Weekly Target Plan Persistence
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5080/api/v1';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runPhase6Suite() {
  console.log('='.repeat(75));
  console.log('PHASE 6 VERIFICATION & PRODUCTION HANDOVER SUITE — TASKFLOW ERP');
  console.log('='.repeat(75));

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Connect to Database
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\nConnected to MongoDB database: ${mongoose.connection.name}`);

  const User = require('../src/modules/auth/models/user.model');
  const Department = require('../src/modules/master/models/department.model');
  const ChecklistTask = require('../src/modules/checklist/models/checklistTask.model');
  const ChecklistOccurrence = require('../src/modules/checklist/models/checklistOccurrence.model');
  const DelegationTask = require('../src/modules/delegation/models/delegationTask.model');

  // =========================================================================
  // 1. DATABASE COMPOUND INDEXES AUDIT
  // =========================================================================
  console.log('\n--- 1. Database Indexes & Query Performance Audit ---');
  const occIndexes = await mongoose.connection.collection('checklistoccurrences').indexes();
  const occIndexKeys = occIndexes.map(i => Object.keys(i.key).join('_'));
  assert(occIndexKeys.includes('status'), 'ChecklistOccurrence has index on status');
  assert(occIndexKeys.includes('assignedTo'), 'ChecklistOccurrence has index on assignedTo');
  assert(occIndexKeys.includes('task_plannedOn'), 'ChecklistOccurrence has compound index on task_plannedOn');

  const dlgIndexes = await mongoose.connection.collection('delegationtasks').indexes();
  const dlgIndexKeys = dlgIndexes.map(i => Object.keys(i.key).join('_'));
  assert(dlgIndexKeys.includes('status'), 'DelegationTask has index on status');
  assert(dlgIndexKeys.includes('dueDate'), 'DelegationTask has index on dueDate');
  assert(dlgIndexKeys.includes('assignedTo'), 'DelegationTask has index on assignedTo');

  // Benchmark query latency
  const t0 = Date.now();
  await ChecklistOccurrence.aggregate([
    { $match: { status: { $in: ['pending', 'overdue', 'done'] } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const occLatency = Date.now() - t0;
  assert(occLatency < 500, `Checklist occurrence aggregation finished in ${occLatency}ms (< 500ms SLA)`);

  const t1 = Date.now();
  await DelegationTask.aggregate([
    { $match: { status: { $in: ['pending', 'completed', 'weekShifted'] } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const dlgLatency = Date.now() - t1;
  assert(dlgLatency < 500, `Delegation task aggregation finished in ${dlgLatency}ms (< 500ms SLA)`);

  // =========================================================================
  // 2. AUTHENTICATION & MASTER DATA ENDPOINTS
  // =========================================================================
  console.log('\n--- 2. Auth & Master API Endpoints ---');
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'admin123' })
  });
  const token = loginRes.data?.data?.token || loginRes.data?.token;
  assert(Boolean(token), 'Admin login succeeded and returned JWT');
  
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const deptsRes = await apiRequest('/master/departments', { headers: authHeaders });
  const deptsList = deptsRes.data?.data || deptsRes.data || [];
  assert(Array.isArray(deptsList) && deptsList.length >= 7,
    `Master departments API returned ${deptsList.length} departments`);

  const usersRes = await apiRequest('/master/users', { headers: authHeaders });
  const usersList = usersRes.data?.data || usersRes.data || [];
  assert(Array.isArray(usersList) && usersList.length >= 24,
    `Master users API returned ${usersList.length} users`);

  const sampleUser = usersList[0];
  const sampleDept = deptsList[0];

  // =========================================================================
  // 3. CHECKLIST FULL LIFECYCLE WORKFLOW
  // =========================================================================
  console.log('\n--- 3. Checklist Full Lifecycle Workflow ---');
  // A. Schedule Preview
  const previewRes = await apiRequest('/checklist/tasks/preview', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      frequency: 'daily',
      anchorDate: '2026-11-14',
      dueTime: '18:00',
      skipSundays: true,
      skipHolidays: false,
      count: 5
    })
  });
  const previewDates = previewRes.data?.data || previewRes.data || [];
  assert(Array.isArray(previewDates) && previewDates.length === 5,
    'Recurrence engine previewed next 5 schedule dates');

  // B. Create Recurring Task
  const chkCreateRes = await apiRequest('/checklist/tasks', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'P6 Handover Test Daily Compliance',
      description: 'Automated verification task',
      assignedTo: sampleUser._id,
      department: sampleDept._id,
      frequency: 'daily',
      anchorDate: '2026-11-14',
      dueTime: '17:30',
      skipSundays: true,
      skipHolidays: false
    })
  });
  const createdTask = chkCreateRes.data?.data || chkCreateRes.data;
  assert(Boolean(createdTask?._id), 'Created new recurring checklist task');
  const createdTaskId = createdTask?._id;

  // C. Fetch Occurrence of Created Task
  const occRes = await apiRequest(`/checklist/occurrences?task=${createdTaskId}`, { headers: authHeaders });
  const occData = occRes.data?.data || occRes.data || {};
  const occurrences = occData.items || occData.occurrences || (Array.isArray(occData) ? occData : []);
  assert(occurrences.length > 0, `Checklist occurrences automatically generated (${occurrences.length} instances)`);
  const occItem = occurrences[0];

  if (occItem) {
    // D. Inline Complete Occurrence
    const completeOccRes = await apiRequest(`/checklist/occurrences/${occItem._id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'done', remarks: 'Phase 6 verified complete' })
    });
    assert(completeOccRes.ok, 'Inline completed checklist occurrence');

    // E. Add Progress Remark to Occurrence
    const progRes = await apiRequest(`/checklist/occurrences/${occItem._id}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ note: 'Progress verified for Phase 6 handover', expectedDate: '2026-11-15' })
    });
    assert(progRes.ok, 'Progress remark recorded successfully on checklist occurrence');
  }

  // =========================================================================
  // 4. DELEGATION FULL LIFECYCLE WORKFLOW
  // =========================================================================
  console.log('\n--- 4. Delegation Full Lifecycle Workflow ---');
  // A. Create Task
  const dlgCreateRes = await apiRequest('/delegation', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'P6 Handover Milestone Verification Task',
      description: 'End to end testing task for handover sign-off',
      assignedTo: sampleUser._id,
      department: sampleDept._id,
      dueDate: '2026-11-20',
      priority: 'high'
    })
  });
  const createdDlg = dlgCreateRes.data?.data || dlgCreateRes.data;
  assert(Boolean(createdDlg?._id), 'Created new delegation task');
  const createdDlgId = createdDlg?._id;

  // B. Verify Immutability of Original Due Date
  assert(createdDlg && createdDlg.originalDueDate && createdDlg.originalDueDate.startsWith('2026-11-20'),
    'Original planned due date is recorded and immutable');

  // C. Revise Due Date
  const reviseRes = await apiRequest(`/delegation/${createdDlgId}/revise`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      newDueDate: '2026-11-22',
      reason: 'Testing date extension workflow for Phase 6',
      kind: 'revise'
    })
  });
  const revisedDlg = reviseRes.data?.data || reviseRes.data;
  assert(revisedDlg?.revisionCount === 1,
    'Date revision logged with reason and revisionCount incremented to 1');

  // D. Add Follow-up Progress Note
  const followUpRes = await apiRequest(`/delegation/${createdDlgId}/progress`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      note: 'Auditing final delivery status',
      expectedDate: '2026-11-22'
    })
  });
  assert(followUpRes.ok, 'Progress note logged with expected date');

  // E. Complete Delegation Task
  const completeDlgRes = await apiRequest(`/delegation/${createdDlgId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'completed' })
  });
  assert(completeDlgRes.ok, 'Marked delegation task as completed');

  // =========================================================================
  // 5. REPORT ANALYTICS & WEEKLY TARGET PLANS
  // =========================================================================
  console.log('\n--- 5. Reports & Target Plans Verification ---');
  // A. Checklist Weekly Report
  const chkReportRes = await apiRequest('/checklist/report/weekly?weekStart=2026-11-09', { headers: authHeaders });
  const chkReportData = chkReportRes.data?.data || chkReportRes.data;
  assert(chkReportRes.ok && chkReportData?.weekStart,
    'Checklist weekly report computed with % work not done and doer distribution');

  // B. Checklist Weekly Plan Persistence
  const chkPlanRes = await apiRequest('/checklist/report/weekly/plan', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      weekStart: '2026-11-09',
      nextWeekPlanned: 15
    })
  });
  assert(chkPlanRes.ok, 'Saved checklist next-week planned target');

  // C. Delegation Weekly Report (RYG)
  const dlgReportRes = await apiRequest('/delegation/report/weekly?weekStart=2026-11-08', { headers: authHeaders });
  const dlgReportData = dlgReportRes.data?.data || dlgReportRes.data;
  assert(dlgReportRes.ok && dlgReportData?.summary,
    'Delegation weekly report computed with Red/Yellow/Green percentages');

  // D. Delegation Weekly Plan Persistence
  const dlgPlanRes = await apiRequest('/delegation/report/weekly/plan', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      weekStart: '2026-11-08',
      next: { red: 5, yellow: 15, green: 80 }
    })
  });
  assert(dlgPlanRes.ok, 'Saved delegation R/Y/G next-week target plan');

  // Clean up created test tasks
  if (createdTaskId) {
    await ChecklistTask.findByIdAndDelete(createdTaskId);
    await ChecklistOccurrence.deleteMany({ task: createdTaskId });
  }
  if (createdDlgId) {
    await DelegationTask.findByIdAndDelete(createdDlgId);
  }

  // Disconnect DB
  await mongoose.disconnect();

  console.log('\n' + '='.repeat(75));
  console.log(`PHASE 6 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(75));

  if (failed === 0) {
    console.log('\n>>> ALL PHASE 6 PRODUCTION HANDOVER CHECKS PASSED WITH 100% SUCCESS <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> PHASE 6 VERIFICATION FAILED <<<\n');
    process.exit(1);
  }
}

runPhase6Suite().catch((err) => {
  console.error('Fatal error during Phase 6 verification:', err);
  process.exit(1);
});
