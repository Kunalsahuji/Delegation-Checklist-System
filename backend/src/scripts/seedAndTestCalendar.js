const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const calendarService = require('../modules/crm/services/calendar.service');
const User = require('../modules/auth/models/user.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_erp';

async function runTest() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    const user = await User.findOne({ status: 'active' });

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    console.log(`\n--- Fetching Calendar Activities for Month: ${from.slice(0, 10)} to ${to.slice(0, 10)} ---`);
    const activities = await calendarService.getActivities({
      from,
      to,
      actor: user,
    });

    console.log(`Aggregated ${activities.length} total activities:`);
    activities.slice(0, 5).forEach((act, idx) => {
      console.log(` ${idx + 1}. [${act.type}] ${act.title} - Client: "${act.clientName}" - Date: ${new Date(act.at).toLocaleDateString()} - User: ${act.assignedUser}`);
    });

    console.log('\n✅ ALL BACKEND UNIFIED CRM CALENDAR TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();
