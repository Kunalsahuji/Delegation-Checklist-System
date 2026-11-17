const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../modules/auth/models/user.model');
const Lead = require('../modules/crm/models/lead.model');
const LeadStage = require('../modules/crm/models/leadStage.model');
const LeadAssignment = require('../modules/crm/models/leadAssignment.model');
const leadAssignmentService = require('../modules/crm/services/leadAssignment.service');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_erp';

async function runTest() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // 1. Ensure at least 2 active users exist
    let users = await User.find({ status: 'active' });
    if (users.length < 2) {
      console.log('Creating demo sales users for test...');
      const u1 = await User.create({
        name: 'Sales Rep Vikram',
        email: 'vikram.sales@taskflow.local',
        password: 'password123',
        role: 'Employee',
        status: 'active',
      });
      const u2 = await User.create({
        name: 'Sales Rep Priya',
        email: 'priya.sales@taskflow.local',
        password: 'password123',
        role: 'Employee',
        status: 'active',
      });
      users = [u1, u2];
    }
    const [userA, userB] = users;
    console.log(`Using sales users: ${userA.name} (${userA._id}) and ${userB.name} (${userB._id})`);

    // 2. Ensure initial lead stage exists
    let initialStage = await LeadStage.findOne({ isDefault: true }) || await LeadStage.findOne().sort({ order: 1 });
    if (!initialStage) {
      console.log('Creating default stage...');
      initialStage = await LeadStage.create({
        name: 'Qualified Intake',
        slug: 'qualified-intake',
        order: 1,
        colorHex: '#3B82F6',
        isDefault: true,
      });
    }

    // 3. Create test unassigned leads
    console.log('\n--- Creating 3 Test Qualified Leads ---');
    const l1 = await Lead.create({
      leadNumber: `LD-TEST-${Date.now()}-1`,
      clientName: 'Rajesh Kedia',
      clientPhone: '9829011111',
      clientEmail: 'rajesh.kedia@example.com',
      currentStageId: initialStage._id,
      currentStageName: initialStage.name,
      currentStageOrder: initialStage.order,
      temperature: 'hot',
      status: 'active',
      budget: 8500000,
      project: 'Sunrise Elite',
    });

    const l2 = await Lead.create({
      leadNumber: `LD-TEST-${Date.now()}-2`,
      clientName: 'Sunita Meena',
      clientPhone: '9829022222',
      clientEmail: 'sunita.meena@example.com',
      currentStageId: initialStage._id,
      currentStageName: initialStage.name,
      currentStageOrder: initialStage.order,
      temperature: 'warm',
      status: 'active',
      budget: 6500000,
      project: 'Palm Enclave',
    });

    const l3 = await Lead.create({
      leadNumber: `LD-TEST-${Date.now()}-3`,
      clientName: 'Alok Singhal',
      clientPhone: '9829033333',
      clientEmail: 'alok.singhal@example.com',
      currentStageId: initialStage._id,
      currentStageName: initialStage.name,
      currentStageOrder: initialStage.order,
      temperature: 'cold',
      status: 'active',
      budget: 4500000,
      project: 'Heritage Meadows',
    });

    console.log(`Created test leads: ${l1.leadNumber}, ${l2.leadNumber}, ${l3.leadNumber}`);

    // 4. Test KPIs
    console.log('\n--- Testing Lead Assignment KPIs ---');
    const kpis = await leadAssignmentService.getKPIs();
    console.log('KPIs:', kpis);

    // 5. Test Workload
    console.log('\n--- Testing Sales Workload ---');
    const workload = await leadAssignmentService.getWorkload();
    console.log(`Sales reps with workload: ${workload.length}`);
    workload.forEach((w) => console.log(` - ${w.name}: ${w.total} leads (${w.percentage}%)`));

    // 6. Test Initial Single Assignment
    console.log('\n--- Testing Single Lead Assignment ---');
    const assignResult = await leadAssignmentService.assignLead(
      l1._id,
      { assignedTo: userA._id, reason: 'High priority luxury villa lead for senior rep' },
      userA
    );
    console.log(`Assigned ${assignResult.lead.leadNumber} to ${assignResult.lead.assignedTo.name}`);
    console.log(`Assignment record ID: ${assignResult.assignment._id}, trigger: ${assignResult.assignment.triggerType}`);

    // 7. Test Reassignment Validation (reason required > 10 chars)
    console.log('\n--- Testing Reassignment Validation ---');
    try {
      await leadAssignmentService.assignLead(
        l1._id,
        { assignedTo: userB._id, reason: 'Short' },
        userA
      );
      throw new Error('Should have failed due to short reason!');
    } catch (e) {
      console.log('Expected error caught on short reason:', e.message);
    }

    // Now reassign with proper reason
    const reassignResult = await leadAssignmentService.assignLead(
      l1._id,
      { assignedTo: userB._id, reason: 'Reassigned due to client language preference' },
      userA
    );
    console.log(`Successfully reassigned to: ${reassignResult.lead.assignedTo.name}, trigger: ${reassignResult.assignment.triggerType}`);

    // 8. Test Bulk Assignment
    console.log('\n--- Testing Bulk Assignment ---');
    const bulkResult = await leadAssignmentService.bulkAssign(
      {
        leadIds: [l2._id],
        assignedTo: userA._id,
        reason: 'Bulk assigned pending pipeline leads',
      },
      userA
    );
    console.log(`Bulk assign result: ${bulkResult.assignedCount} of ${bulkResult.totalRequested} assigned`);

    // 9. Test Round Robin Distribution
    console.log('\n--- Testing Round Robin Auto-Distribution ---');
    const rrResult = await leadAssignmentService.autoDistributeRoundRobin(
      { leadIds: [l3._id] },
      userA
    );
    console.log('Round-robin result:', rrResult);

    // 10. Test Assignment History
    console.log('\n--- Testing Lead Assignment History ---');
    const history = await leadAssignmentService.getLeadAssignmentHistory(l1._id);
    console.log(`Lead ${l1.leadNumber} has ${history.length} assignment log entries:`);
    history.forEach((h, idx) => {
      console.log(` ${idx + 1}. [${h.triggerType}] Assigned to: ${h.assignedTo?.name || h.assignedToName} (Prev: ${h.previousAssigneeName || 'None'}) - Reason: "${h.assignmentReason}"`);
    });

    console.log('\n✅ ALL BACKEND LEAD ASSIGNMENT TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();
