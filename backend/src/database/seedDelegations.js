const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');
const User = require('../modules/auth/models/user.model');
const Project = require('../modules/master/models/project.model');
const Department = require('../modules/master/models/department.model');
const DelegationTask = require('../modules/delegation/models/delegationTask.model');
const { Counter } = require('../utils/counter');
const { toCivilDate } = require('../utils/recurrence');

async function seedDelegations() {
  await mongoose.connect(config.mongodbUri);
  logger.info('Connected to MongoDB to seed delegations.');

  const admin = await User.findOne({ email: 'admin@company.com' });
  const pm = await User.findOne({ email: 'pm@company.com' });
  const engineer = await User.findOne({ email: 'engineer@company.com' });
  const accounts = await User.findOne({ email: 'accounts@company.com' });
  const director = await User.findOne({ email: 'director@company.com' });
  const aashish = await User.findOne({ email: 'aashish@company.com' });

  const gvr = await Project.findOne({ code: 'GVR' });
  const rcr = await Project.findOne({ code: 'RCR' });
  const bwh = await Project.findOne({ code: 'BWH' });

  const tasksToSeed = [
    {
      code: 'DLG-000004',
      title: '[DEMO] Submit the pending site expense summary',
      assignedTo: engineer?._id,
      assignedToName: engineer?.name || 'Demo Site Engineer',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: null, // Company-wide
      originalDueDate: new Date('2026-10-06T00:00:00.000Z'),
      dueDate: new Date('2026-10-06T00:00:00.000Z'),
      priority: 'medium',
      status: 'completed',
      completedAt: new Date('2026-10-06T17:30:00.000Z'),
      completedBy: engineer?._id,
      completedByName: engineer?.name || 'Demo Site Engineer',
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000001',
      title: 'Monthly vendor balance reconciliation',
      assignedTo: accounts?._id,
      assignedToName: accounts?.name || 'Demo Accounts',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: bwh?._id,
      originalDueDate: new Date('2026-10-08T00:00:00.000Z'),
      dueDate: new Date('2026-10-08T00:00:00.000Z'),
      priority: 'medium',
      status: 'pending',
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000008',
      title: 'Plumbing contractor line pressure check',
      assignedTo: pm?._id,
      assignedToName: pm?.name || 'Demo Project Manager',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: rcr?._id,
      originalDueDate: new Date('2026-10-09T00:00:00.000Z'),
      dueDate: new Date('2026-10-09T00:00:00.000Z'),
      priority: 'medium',
      status: 'completed',
      completedAt: new Date('2026-10-09T16:00:00.000Z'),
      completedBy: pm?._id,
      completedByName: pm?.name,
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000003',
      title: '[DEMO] Verify material delivery status',
      assignedTo: pm?._id,
      assignedToName: pm?.name || 'Demo Project Manager',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: gvr?._id,
      originalDueDate: new Date('2026-10-09T00:00:00.000Z'),
      dueDate: new Date('2026-10-09T00:00:00.000Z'),
      priority: 'medium',
      status: 'pending',
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000009',
      title: 'Structural steel quality certificates upload',
      assignedTo: pm?._id,
      assignedToName: pm?.name || 'Demo Project Manager',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: rcr?._id,
      originalDueDate: new Date('2026-10-10T00:00:00.000Z'),
      dueDate: new Date('2026-10-11T00:00:00.000Z'),
      priority: 'medium',
      status: 'pending',
      revisions: [
        {
          previousDate: new Date('2026-10-10T00:00:00.000Z'),
          newDate: new Date('2026-10-11T00:00:00.000Z'),
          reason: 'Test lab report received 1 day delayed from testing agency',
          revisedBy: admin?._id,
          revisedByName: admin?.name,
          revisedAt: new Date('2026-10-10T14:00:00.000Z'),
          kind: 'revise',
        },
      ],
      revisionCount: 1,
    },
    {
      code: 'DLG-000007',
      title: 'Drilling in site for water pump installation',
      assignedTo: aashish?._id,
      assignedToName: aashish?.name || 'Aashish Rawat',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: rcr?._id,
      originalDueDate: new Date('2026-10-09T00:00:00.000Z'),
      dueDate: new Date('2026-10-11T00:00:00.000Z'),
      priority: 'medium',
      status: 'completed',
      completedAt: new Date('2026-10-11T18:00:00.000Z'),
      completedBy: aashish?._id,
      completedByName: aashish?.name,
      revisions: [
        {
          previousDate: new Date('2026-10-09T00:00:00.000Z'),
          newDate: new Date('2026-10-10T00:00:00.000Z'),
          reason: 'Borewell rig breakdown during transport',
          revisedBy: admin?._id,
          revisedByName: admin?.name,
          revisedAt: new Date('2026-10-09T10:00:00.000Z'),
          kind: 'revise',
        },
        {
          previousDate: new Date('2026-10-10T00:00:00.000Z'),
          newDate: new Date('2026-10-11T00:00:00.000Z'),
          reason: 'Rock layer hardness required secondary chisel drill',
          revisedBy: admin?._id,
          revisedByName: admin?.name,
          revisedAt: new Date('2026-10-10T15:00:00.000Z'),
          kind: 'revise',
        },
      ],
      revisionCount: 2,
    },
    {
      code: 'DLG-000005',
      title: '[DEMO] Update the project work status report',
      assignedTo: pm?._id,
      assignedToName: pm?.name || 'Demo Project Manager',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: null,
      originalDueDate: new Date('2026-10-11T00:00:00.000Z'),
      dueDate: new Date('2026-10-11T00:00:00.000Z'),
      priority: 'medium',
      status: 'completed',
      completedAt: new Date('2026-10-11T12:00:00.000Z'),
      completedBy: pm?._id,
      completedByName: pm?.name,
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000011',
      title: 'Aggregated raw materials procurement order sign-off',
      assignedTo: director?._id,
      assignedToName: director?.name || 'Demo Director',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: null,
      originalDueDate: new Date('2026-10-12T00:00:00.000Z'),
      dueDate: new Date('2026-10-12T00:00:00.000Z'),
      priority: 'high',
      status: 'pending',
      followUp: {
        isDue: true,
        nextOn: new Date('2026-10-12T10:00:00.000Z'),
        lastNote: 'High value purchase order requires director approval before vendor dispatch',
      },
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000010',
      title: 'Secondary batch aggregate sand order',
      assignedTo: engineer?._id,
      assignedToName: engineer?.name || 'Demo Site Engineer',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: null,
      originalDueDate: new Date('2026-10-12T00:00:00.000Z'),
      dueDate: new Date('2026-10-12T00:00:00.000Z'),
      priority: 'high',
      status: 'cancelled',
      cancelReason: 'Order merged with central bulk procurement to save logistics overhead',
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000002',
      title: '[DEMO] Prepare the weekly construction progress report',
      assignedTo: engineer?._id,
      assignedToName: engineer?.name || 'Demo Site Engineer',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: null,
      originalDueDate: new Date('2026-10-13T00:00:00.000Z'),
      dueDate: new Date('2026-10-13T00:00:00.000Z'),
      priority: 'medium',
      status: 'pending',
      revisions: [],
      revisionCount: 0,
    },
    {
      code: 'DLG-000006',
      title: '[DEMO] Follow up on pending vendor documentation',
      assignedTo: engineer?._id,
      assignedToName: engineer?.name || 'Demo Site Engineer',
      assignedBy: admin?._id,
      assignedByName: admin?.name || 'Administrator',
      project: gvr?._id,
      originalDueDate: new Date('2026-10-10T00:00:00.000Z'),
      dueDate: new Date('2026-10-17T00:00:00.000Z'),
      priority: 'medium',
      status: 'pending',
      revisions: [
        {
          previousDate: new Date('2026-10-10T00:00:00.000Z'),
          newDate: new Date('2026-10-17T00:00:00.000Z'),
          reason: 'Vendor accounts officer on medical leave for 1 week',
          revisedBy: admin?._id,
          revisedByName: admin?.name,
          revisedAt: new Date('2026-10-10T09:00:00.000Z'),
          kind: 'weekShift',
        },
      ],
      revisionCount: 1,
    },
  ];

  for (const t of tasksToSeed) {
    await DelegationTask.findOneAndUpdate(
      { code: t.code },
      { $set: t },
      { upsert: true, new: true }
    );
  }

  // Ensure counter sequence is ahead of seeded codes
  await Counter.findByIdAndUpdate(
    'delegation_task',
    { $max: { seq: 50 } },
    { upsert: true }
  );

  logger.info(`Successfully seeded ${tasksToSeed.length} realistic delegation tasks.`);
  await mongoose.disconnect();
}

seedDelegations().catch((err) => {
  logger.error('Seeding failed', err);
  process.exit(1);
});
