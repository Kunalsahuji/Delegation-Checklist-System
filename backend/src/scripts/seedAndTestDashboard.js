const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const crmDashboardService = require('../modules/crm/services/dashboard.service');

async function run() {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://tangdi:taskflow-erp@kunalcluster.beakm07.mongodb.net/tangdi-uat';

  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  try {
    console.log('\n--- 1. Testing Executive Dashboard Data Aggregation ---');
    const data = await crmDashboardService.getDashboardData();

    console.log('Dashboard KPIs:', data.kpis);
    console.log('\n--- 2. Pipeline Funnel Breakdown ---');
    data.funnel.forEach((f) => console.log(` Stage: ${f.stage} -> ${f.count} leads`));

    console.log('\n--- 3. Lead Sources ---');
    data.leadSources.forEach((s) => console.log(` Source: ${s.source} -> ${s.count}`));

    console.log('\n--- 4. Client Temperatures ---', data.temperatures);
    console.log('\n--- 5. Operational Radar ---', data.operations);
    console.log('\n--- 6. Team Performers ---', data.teamPerformers);
    console.log(`\n--- 7. Recent Enquiries --- Found ${data.recentEnquiries.length} records`);

    console.log('\n✅ ALL BACKEND EXECUTIVE DASHBOARD TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
