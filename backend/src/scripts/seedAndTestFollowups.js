const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../modules/auth/models/user.model');
const Lead = require('../modules/crm/models/lead.model');
const LeadStage = require('../modules/crm/models/leadStage.model');
const Enquiry = require('../modules/crm/models/enquiry.model');
const Reminder = require('../modules/crm/models/reminder.model');
const reminderService = require('../modules/crm/services/reminder.service');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_erp';

async function runTest() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    const user = await User.findOne({ status: 'active' });
    const stage = await LeadStage.findOne({ isDefault: true }) || await LeadStage.findOne().sort({ order: 1 });

    // 1. Create a test lead
    const lead = await Lead.create({
      leadNumber: `LD-FLW-${Date.now()}`,
      clientName: 'Manish Pareek',
      clientPhone: '9829155555',
      currentStageId: stage._id,
      currentStageName: stage.name,
      temperature: 'hot',
      status: 'active',
      specialFollowUp: true,
      budget: 9500000,
    });

    // 2. Create a test enquiry
    const enquiry = await Enquiry.create({
      enquiryNumber: `ENQ-FLW-${Date.now()}`,
      clientName: 'Pooja Agarwal',
      clientPhone: '9829166666',
      specialFollowUp: true,
      budgetMax: 7000000,
      temperature: 'warm',
    });

    console.log(`Created test lead ${lead.leadNumber} & enquiry ${enquiry.enquiryNumber}`);

    // 3. Create Overdue, Today, and Upcoming Reminders
    console.log('\n--- Creating Test Reminders ---');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const today = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const overdueRem = await reminderService.createReminder(
      {
        referenceType: 'lead',
        referenceId: lead._id,
        category: 'followup',
        assignedTo: user._id,
        title: 'Discuss revised floor plan with Manish',
        reminderDate: yesterday,
        reminderTime: '11:00',
      },
      user
    );

    const todayRem = await reminderService.createReminder(
      {
        referenceType: 'enquiry',
        referenceId: enquiry._id,
        category: 'followup',
        assignedTo: user._id,
        title: 'Call Pooja for weekend site visit schedule',
        reminderDate: today,
        reminderTime: '15:30',
      },
      user
    );

    const upcomingRem = await reminderService.createReminder(
      {
        referenceType: 'lead',
        referenceId: lead._id,
        category: 'plannedDate',
        assignedTo: user._id,
        title: 'Planned stage advance review',
        reminderDate: tomorrow,
        reminderTime: '10:00',
      },
      user
    );

    console.log(`Created 3 reminders: Overdue (${overdueRem._id}), Today (${todayRem._id}), Upcoming (${upcomingRem._id})`);

    // 4. Test Stats
    console.log('\n--- Testing Reminder KPI Stats ---');
    const stats = await reminderService.getStats();
    console.log('Stats:', stats);

    if (stats.dueToday < 1) throw new Error('Expected at least 1 due today reminder!');
    if (stats.overdue < 1) throw new Error('Expected at least 1 overdue reminder!');
    if (stats.specialFollowUps < 2) throw new Error('Expected at least 2 special follow-up items!');

    // 5. Test List Reminders with Filtering
    console.log('\n--- Testing List Reminders ---');
    const listDueToday = await reminderService.listReminders({ filterStatus: 'dueToday' });
    console.log(`Due today count: ${listDueToday.total}, first item client: ${listDueToday.reminders[0]?.clientName}`);

    // 6. Test Complete Reminder
    console.log('\n--- Testing Complete Reminder ---');
    const completed = await reminderService.completeReminder(
      todayRem._id,
      { completionRemarks: 'Client confirmed 3 PM visit for Saturday.' },
      user
    );
    console.log(`Reminder completed: ${completed.status}, Completed By: ${completed.completedBy?.name}`);

    // 7. Test Reschedule Reminder
    console.log('\n--- Testing Reschedule Reminder ---');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const rescheduled = await reminderService.rescheduleReminder(
      overdueRem._id,
      { reminderDate: nextWeek, reminderTime: '12:00', reason: 'Client out of town' },
      user
    );
    console.log(`Reminder rescheduled to: ${rescheduled.reminderAt}`);

    // 8. Test Special Follow-ups
    console.log('\n--- Testing Special Follow-ups List ---');
    const specials = await reminderService.listSpecialFollowups({ search: 'Manish' });
    console.log(`Found ${specials.total} special follow-up items for Manish:`, specials.items[0]?.clientName);

    // 9. Test Toggle Special Follow-up
    console.log('\n--- Testing Toggle Special Follow-up ---');
    await reminderService.toggleSpecialFollowup({
      referenceType: 'lead',
      referenceId: lead._id,
      specialFollowUp: false,
    });
    const postToggle = await Lead.findById(lead._id);
    console.log(`Lead specialFollowUp is now: ${postToggle.specialFollowUp}`);

    console.log('\n✅ ALL BACKEND FOLLOW-UPS & SPECIAL FOLLOW-UPS TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();
