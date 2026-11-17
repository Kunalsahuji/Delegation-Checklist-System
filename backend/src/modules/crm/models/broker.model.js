const mongoose = require('mongoose');

const BROKER_LEVELS = [
  { name: 'Associate', min: 0, max: 199 },
  { name: 'Executive', min: 200, max: 499 },
  { name: 'Sales Manager', min: 500, max: 999 },
  { name: 'Senior Sales Manager', min: 1000, max: 1999 },
  { name: 'Area Sales Manager', min: 2000, max: 3999 },
  { name: 'Regional Sales Manager', min: 4000, max: 6999 },
  { name: 'Assistant Sales Director', min: 7000, max: 9999 },
  { name: 'Sales Director', min: 10000, max: Infinity },
];

const BROKER_LEVEL_NAMES = BROKER_LEVELS.map((l) => l.name);

const brokerSchema = new mongoose.Schema(
  {
    brokerCode: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    alternatePhone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    agencyName: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },

    level: {
      type: String,
      enum: BROKER_LEVEL_NAMES,
      default: 'Associate',
      index: true,
    },
    totalYards: { type: Number, min: 0, default: 0, index: true },
    commissionRate: { type: Number, min: 0, max: 100, default: 2 }, // % commission

    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    managedByName: { type: String, trim: true, default: '' },

    seniorBrokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Broker',
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    notes: { type: String, trim: true, default: '' },

    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Helper function to calculate level qualification progress
brokerSchema.methods.calculateProgress = function () {
  const y = Math.max(0, Number(this.totalYards) || 0);
  const currentIdx = BROKER_LEVELS.findIndex((l) => l.name === this.level);
  const current = currentIdx >= 0 ? BROKER_LEVELS[currentIdx] : BROKER_LEVELS[0];
  const next = BROKER_LEVELS[currentIdx + 1] || null;

  const bandStart = current ? current.min : 0;
  const bandEnd = next ? next.min : bandStart;
  const remaining = next ? Math.max(0, next.min - y) : 0;
  const progressPct =
    next && bandEnd > bandStart
      ? Math.min(100, Math.max(0, Math.round(((y - bandStart) / (bandEnd - bandStart)) * 100)))
      : 100;

  return {
    currentLevel: current.name,
    currentLevelIndex: currentIdx,
    nextLevel: next ? next.name : null,
    totalYards: y,
    remainingYards: remaining,
    progressPct,
    eligibleForPromotion: Boolean(next && y >= next.min),
  };
};

module.exports = mongoose.model('Broker', brokerSchema);
module.exports.BROKER_LEVELS = BROKER_LEVELS;
module.exports.BROKER_LEVEL_NAMES = BROKER_LEVEL_NAMES;
