const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const MetaLead = require('../modules/crm/models/metaLead.model');
const Enquiry = require('../modules/crm/models/enquiry.model');
const User = require('../modules/auth/models/user.model');
const metaLeadService = require('../modules/crm/services/metaLead.service');

async function run() {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://tangdi:taskflow-erp@kunalcluster.beakm07.mongodb.net/tangdi-uat';

  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  try {
    // 1. Get or create test user
    let user = await User.findOne({ status: 'active' });
    if (!user) {
      user = await User.create({
        name: 'Demo Meta Agent',
        email: `meta.agent.${Date.now()}@taskflow.local`,
        password: 'password123',
        role: 'Employee',
      });
    }

    console.log('\n--- 1. Testing Create Meta Lead in Holding Area ---');
    const testPhone = `9829${Math.floor(100000 + Math.random() * 900000)}`;
    const lead1 = await metaLeadService.createLead(
      {
        clientName: 'Vikramaditya Rathore',
        clientPhone: testPhone,
        clientEmail: 'vikram.rathore@example.com',
        formName: 'Jaipur Super Luxury Villas Lead Ad',
        campaignName: 'Instagram Reels Diwali Campaign',
        requirement: '4 BHK Luxury Villa with Garden',
        budget: '₹90 lakhs - ₹1.2 cr',
        city: 'Jaipur',
      },
      user._id
    );

    console.log(`Created Meta Lead: ${lead1.clientName} (${lead1.leadgenId})`);
    console.log(`Initial Status: ${lead1.status}, Phone: ${lead1.clientPhone}`);

    console.log('\n--- 2. Testing Duplicate Prevention on Meta Ingest ---');
    const leadDuplicate = await metaLeadService.createLead(
      {
        clientName: 'Vikramaditya Duplicate',
        clientPhone: testPhone,
        formName: 'Facebook Feed Ad',
      },
      user._id
    );

    console.log(
      `Duplicate Lead Status: ${leadDuplicate.status}, Skip Reason: ${leadDuplicate.skipReason}`
    );
    if (leadDuplicate.status !== 'skipped') {
      throw new Error('Expected duplicate lead to be auto-classified as skipped');
    }

    console.log('\n--- 3. Testing Meta Leads KPIs ---');
    const kpis = await metaLeadService.getKPIs();
    console.log('Holding Area KPIs:', kpis);

    console.log('\n--- 4. Testing Batch Round-Robin Assignment to Sales Team ---');
    const assignResult = await metaLeadService.assignLeads({
      leadIds: [lead1._id],
      userIds: [user._id],
      actorId: user._id,
    });

    console.log('Assignment Result:', assignResult);
    if (assignResult.assignedCount !== 1) {
      throw new Error('Expected 1 lead to be successfully assigned');
    }

    // Verify lead status in DB
    const updatedLead = await MetaLead.findById(lead1._id);
    console.log(`Updated Lead Status: ${updatedLead.status}, Enquiry ID: ${updatedLead.enquiryId}`);
    if (updatedLead.status !== 'assigned' || !updatedLead.enquiryId) {
      throw new Error('MetaLead was not marked assigned or enquiryId is missing');
    }

    // Verify Enquiry in DB
    const createdEnquiry = await Enquiry.findById(updatedLead.enquiryId);
    console.log(
      `Created Enquiry: ${createdEnquiry.enquiryNumber}, Source: ${createdEnquiry.source}, Client: ${createdEnquiry.clientName}`
    );
    if (createdEnquiry.source !== 'metaAds') {
      throw new Error('Expected created enquiry to have source metaAds');
    }

    console.log('\n--- 5. Testing List & Filter ---');
    const listRes = await metaLeadService.listLeads({ status: 'assigned', limit: 5 });
    console.log(`Found ${listRes.data.length} assigned leads (Total: ${listRes.pagination.total})`);

    // Clean up
    console.log('\n--- 6. Cleaning Up Test Data ---');
    await MetaLead.deleteMany({ _id: { $in: [lead1._id, leadDuplicate._id] } });
    await Enquiry.deleteOne({ _id: createdEnquiry._id });
    console.log('Cleaned up test Meta leads and Enquiry.');

    console.log('\n✅ ALL BACKEND META LEADS TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
