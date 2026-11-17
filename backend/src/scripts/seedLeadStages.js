const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LeadStage = require('../modules/crm/models/leadStage.model');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_LEAD_STAGES = [
  {
    name: 'Call For Visit Confirmation By S/C',
    order: 1,
    color: '#3B82F6',
    description: 'Sales Co-ordinator calls the client to confirm the site visit details and schedule.',
    slaHours: 24,
    isInitial: true,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Whatsapp & Email Confirmation Message to Clients By S/C',
    order: 2,
    color: '#06B6D4',
    description: 'Sales Co-ordinator dispatches WhatsApp location pin, brochure, and email confirmation.',
    slaHours: 24,
    isInitial: false,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Remind Call By Telesales',
    order: 3,
    color: '#8B5CF6',
    description: 'Telesales executive reminder call 2-4 hours prior to the scheduled site visit.',
    slaHours: 24,
    isInitial: false,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Visit Confirmed',
    order: 4,
    color: '#10B981',
    description: 'Buyer has confirmed attendance and driver/field executive has been scheduled.',
    slaHours: 24,
    isInitial: false,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Feedback Call by Sales Co-ordinator',
    order: 5,
    color: '#22C55E',
    description: 'Post-visit debrief to record buyer sentiment, favorite units, and objections.',
    slaHours: 24,
    isInitial: false,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Follow-Up Call By Sales Person',
    order: 6,
    color: '#EF4444',
    description: 'Direct sales representative follow-up call addressing pricing, terms, and customized offers.',
    slaHours: 48,
    isInitial: false,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Call For Negotiation and Family Visit',
    order: 7,
    color: '#EC4899',
    description: 'Decision maker consultation, family revisit, and commercial terms negotiation.',
    slaHours: 48,
    isInitial: false,
    isFinal: false,
    isSystem: true,
  },
  {
    name: 'Call For Final Deal',
    order: 8,
    color: '#F59E0B',
    description: 'Closing call for token advance payment and allotment booking.',
    slaHours: 48,
    isInitial: false,
    isFinal: true,
    isSystem: true,
  },
];

async function seedLeadStages() {
  for (const stage of DEFAULT_LEAD_STAGES) {
    await LeadStage.findOneAndUpdate(
      { name: stage.name },
      { $set: stage },
      { upsert: true, new: true }
    );
  }
}

async function runStandalone() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  await seedLeadStages();
  console.log('Lead stages seeded successfully!');
  const stages = await LeadStage.find().sort({ order: 1 });
  console.log(`Current Lead Stages count: ${stages.length}`);
  stages.forEach((s) => console.log(`[Stage ${s.order}] ${s.name} (${s.color})`));
  await mongoose.disconnect();
}

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error('Seed lead stages failed:', err);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_LEAD_STAGES,
  seedLeadStages,
};
