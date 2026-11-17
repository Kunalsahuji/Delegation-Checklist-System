const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const leadService = require('../modules/crm/services/lead.service');
const enquiryService = require('../modules/crm/services/enquiry.service');
const Project = require('../modules/master/models/project.model');
const Lead = require('../modules/crm/models/lead.model');
const LeadStage = require('../modules/crm/models/leadStage.model');
const LeadStageHistory = require('../modules/crm/models/leadStageHistory.model');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function dryRunLeads() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';
  await mongoose.connect(uri);
  console.log('--- [DRY RUN] Connected to MongoDB ---');

  // 1. Verify Stages
  const stages = await leadService.listStages();
  console.log(`[PASS] Found ${stages.length} active lead stages.`);
  if (stages.length < 8) {
    throw new Error('Expected 8 default stages');
  }

  // 2. Create test Enquiry and promote to Lead
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const enquiry = await enquiryService.createEnquiry({
    clientName: 'Vikram Malhotra',
    clientPhone: testPhone,
    clientEmail: 'vikram.malhotra@example.com',
    city: 'Jaipur',
    source: 'metaAds',
    temperature: 'hot',
    propertyType: 'villa',
    budget: 7500000,
    project: 'Emerald Valley Villas',
    notes: 'Interested in 4BHK corner villa with east facing entry.',
  });
  console.log(`[PASS] Created test enquiry: ${enquiry.enquiryNumber} (${enquiry.clientName})`);

  // Promote to Lead
  const lead = await leadService.createFromEnquiry(enquiry._id, null, 'Test Runner');
  console.log(`[PASS] Promoted to Lead: ${lead.leadNumber} in Stage "${lead.currentStageName}" (Order ${lead.currentStageOrder})`);

  // 3. Move Lead Stage: Stage 1 -> Stage 2 -> Stage 4 (Visit Confirmed)
  const stage2 = stages.find((s) => s.order === 2);
  const stage4 = stages.find((s) => s.order === 4);

  const move1 = await leadService.moveStage(
    lead._id,
    {
      toStageId: stage2._id,
      comment: 'Dispatched brochure & brochure location pin via WhatsApp.',
    },
    null,
    'Sales Rep'
  );
  console.log(`[PASS] Moved to Stage 2: ${move1.lead.currentStageName}`);

  const move2 = await leadService.moveStage(
    lead._id,
    {
      toStageId: stage4._id,
      comment: 'Buyer confirmed site visit for Saturday 11:00 AM.',
      plannedAt: new Date(Date.now() + 86400000),
    },
    null,
    'Sales Rep'
  );
  console.log(`[PASS] Moved to Stage 4 (Visit Confirmed): ${move2.lead.currentStageName}`);

  // 4. Test Undo Stage Transition
  const undoResult = await leadService.undoStage(lead._id, null, 'Manager');
  console.log(`[PASS] Undone last stage! Reverted to: ${undoResult.lead.currentStageName}`);

  // Move back to Stage 4
  await leadService.moveStage(
    lead._id,
    { toStageId: stage4._id, comment: 'Re-confirmed visit.' },
    null,
    'Sales Rep'
  );

  // 5. Test Mark Won with Project Unit
  const project = await Project.findOne({ 'units.0': { $exists: true } });
  let unitToBook = null;
  if (project && project.units && project.units.length > 0) {
    unitToBook = project.units.find((u) => u.status === 'available') || project.units[0];
  }

  const wonLead = await leadService.markWon(
    lead._id,
    {
      finalizedProjectId: project ? project._id : null,
      finalizedProjectName: project ? project.name : 'Royal Palms',
      finalizedUnitId: unitToBook ? unitToBook._id : null,
      finalizedUnitNumber: unitToBook ? unitToBook.unitNumber : 'V-102',
      yards: 250,
      actualValue: 8200000,
      comment: 'Token advance received. Allotment letter issued.',
    },
    null,
    'Closer'
  );
  console.log(`[PASS] Marked Lead Won: Status=${wonLead.status}, Yards=${wonLead.yards}, Value=₹${wonLead.actualValue}`);

  // 6. Test listLeads and KPIs
  const listResult = await leadService.listLeads({ status: 'all' });
  console.log('[PASS] listLeads KPI summary:', listResult.kpis);
  console.log(`[PASS] Total leads listed: ${listResult.leads.length}, total pages: ${listResult.pagination.totalPages}`);

  // 7. Verify Lead Detail and History
  const detail = await leadService.getLeadById(lead._id);
  console.log(`[PASS] Lead Detail History entries count: ${detail.stageHistory.length}`);
  detail.stageHistory.forEach((h, i) => {
    console.log(`   #${i + 1} [${h.toStageName}] - ${h.comment} (isUndo: ${h.isUndo})`);
  });

  console.log('\n--- ALL LEAD WORKFLOW DRY-RUN CHECKS PASSED SUCCESSFULLY! ---');
  await mongoose.disconnect();
}

dryRunLeads().catch((err) => {
  console.error('[FAIL] Leads dry run failed:', err);
  process.exit(1);
});
