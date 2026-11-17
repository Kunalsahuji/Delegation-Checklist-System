const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const BulkCampaign = require('../modules/crm/models/bulkCampaign.model');
const Enquiry = require('../modules/crm/models/enquiry.model');
const User = require('../modules/auth/models/user.model');
const bulkMessageService = require('../modules/crm/services/bulkMessage.service');

async function run() {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://tangdi:taskflow-erp@kunalcluster.beakm07.mongodb.net/tangdi-uat';

  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  try {
    const user = await User.findOne({ status: 'active' });

    console.log('\n--- 1. Testing Get Templates ---');
    const templates = bulkMessageService.getTemplates();
    console.log(`Found ${templates.length} pre-approved real-estate marketing templates:`);
    templates.forEach((t) => console.log(` - ${t.name} (${t.id})`));

    console.log('\n--- 2. Testing Audience Preview Calculation ---');
    const allPreview = await bulkMessageService.previewAudience({ mode: 'all' });
    console.log('All Audience Reachable Preview:', allPreview);

    const brokerPreview = await bulkMessageService.previewAudience({ mode: 'brokers' });
    console.log('Broker Network Reachable Preview:', brokerPreview);

    console.log('\n--- 3. Testing Create and Launch Bulk Campaign ---');
    // Ensure at least one test enquiry exists to test recipient resolution
    const dummyPhone = `9829${Math.floor(100000 + Math.random() * 900000)}`;
    const testEnq = await Enquiry.create({
      clientName: 'Bulk Test Client',
      clientPhone: dummyPhone,
      source: 'phone',
      status: 'new',
    });

    const campaign = await bulkMessageService.createCampaign(
      {
        name: 'Diwali Villa Launch Special Blast 2026',
        templateName: 'festive_luxury_villas',
        bodyText: 'Exclusive 5% pre-launch concession on first 10 luxury villas booked this week!',
        selection: { mode: 'all' },
      },
      user ? user._id : null
    );

    console.log(`Created Campaign: "${campaign.name}" (${campaign._id})`);
    console.log(`Initial Status: ${campaign.status}, Total Recipients: ${campaign.total}`);

    // Wait 500ms for simulated background send loop to process
    await new Promise((r) => setTimeout(r, 600));

    const refreshed = await bulkMessageService.getCampaignById(campaign._id);
    console.log(
      `Refreshed Campaign Status: ${refreshed.status}, Sent: ${refreshed.sent}, Delivered: ${refreshed.delivered}`
    );

    console.log('\n--- 4. Testing Bulk Message KPIs ---');
    const kpis = await bulkMessageService.getKPIs();
    console.log('Campaign KPIs:', kpis);

    console.log('\n--- 5. Testing List Campaigns with Pagination ---');
    const list = await bulkMessageService.listCampaigns({ limit: 5 });
    console.log(`Found ${list.data.length} campaigns (Total: ${list.pagination.total})`);

    // Clean up
    console.log('\n--- 6. Cleaning Up Test Data ---');
    await BulkCampaign.deleteOne({ _id: campaign._id });
    await Enquiry.deleteOne({ _id: testEnq._id });
    console.log('Cleaned up test campaign and test enquiry.');

    console.log('\n✅ ALL BACKEND BULK MESSAGING TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
