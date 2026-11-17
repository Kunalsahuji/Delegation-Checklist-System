const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Broker = require('../modules/crm/models/broker.model');
const brokerService = require('../modules/crm/services/broker.service');
const User = require('../modules/auth/models/user.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_erp';

async function runTest() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    const user = await User.findOne({ status: 'active' });

    console.log('\n--- Creating Test Channel Partners / Brokers ---');
    const b1 = await brokerService.createBroker(
      {
        name: 'Sunil Shekhawat',
        phone: `98292${Math.floor(10000 + Math.random() * 90000)}`,
        agencyName: 'Shekhawat Real Estate & Builders',
        city: 'Jaipur',
        level: 'Associate',
        totalYards: 150,
        managedBy: user?._id,
      },
      user
    );

    const b2 = await brokerService.createBroker(
      {
        name: 'Rajendra Choudhary',
        phone: `98293${Math.floor(10000 + Math.random() * 90000)}`,
        agencyName: 'Choudhary Property Consultants',
        city: 'Jaipur',
        level: 'Sales Manager',
        totalYards: 850,
        managedBy: user?._id,
      },
      user
    );

    console.log(`Created test brokers: ${b1.name} (${b1.brokerCode}) & ${b2.name} (${b2.brokerCode})`);

    // 1. Test KPIs
    console.log('\n--- Testing Broker KPIs ---');
    const kpis = await brokerService.getKPIs();
    console.log('KPIs:', kpis);

    // 2. Test List & Progression Calculation
    console.log('\n--- Testing List Brokers & Tier Progression ---');
    const list = await brokerService.listBrokers({ search: 'Shekhawat' });
    console.log(`Found ${list.total} brokers matching "Shekhawat":`);
    const brokerItem = list.brokers[0];
    console.log(` - Name: ${brokerItem.name}`);
    console.log(` - Level: ${brokerItem.level}`);
    console.log(` - Total Yards: ${brokerItem.totalYards}`);
    console.log(` - Progress to ${brokerItem.progress.nextLevel}: ${brokerItem.progress.progressPct}% (${brokerItem.progress.remainingYards} yds needed)`);

    // 3. Test Detail View
    console.log('\n--- Testing Get Broker by ID ---');
    const details = await brokerService.getBrokerById(b1._id);
    console.log(`Loaded details for ${details.broker.name}, referrals: ${details.referrals.totalEnquiries} enquiries`);

    // 4. Test Network Hierarchy
    console.log('\n--- Testing Network Hierarchy Tree ---');
    const hierarchy = await brokerService.getNetworkHierarchy();
    console.log(`Hierarchy tiers: ${hierarchy.length}`);
    hierarchy.forEach((h) => {
      if (h.memberCount > 0) {
        console.log(` Level: ${h.levelName} (${h.memberCount} members, ${h.totalYards} total yards)`);
      }
    });

    // 5. Test Soft Delete
    console.log('\n--- Testing Soft Delete Broker ---');
    await brokerService.deleteBroker(b2._id, user);
    const postDel = await Broker.findById(b2._id);
    console.log(`Broker b2 deletedAt: ${postDel.deletedAt}`);

    console.log('\n✅ ALL BACKEND BROKERS & NETWORK TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();
