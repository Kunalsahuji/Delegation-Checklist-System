const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  BASELINE_STATUS,
  DEFAULT_MATERIALS,
  DEFAULT_LABOUR_TRADES,
  DEFAULT_TIMELINE_MILESTONES,
} = require('../constants/pms.constants');

const sectionBase = {
  status: { type: String, enum: ['pending', 'inProgress', 'completed'], default: 'pending' },
  remarks: { type: String, trim: true, default: '', maxlength: 2000 },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date, default: null },
};

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, default: '' },
    to: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, trim: true, default: '', maxlength: 1000 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 1. Planned Material
const materialItemSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 200 },
  category: { type: String, trim: true, default: 'general', maxlength: 80 },
  unit: { type: String, trim: true, required: true, maxlength: 40 },
  plannedQuantity: { type: Number, min: 0, default: 0 },
  unitRate: { type: Number, min: 0, default: 0 },
  totalEstimatedCost: { type: Number, min: 0, default: 0 },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const plannedMaterialSchema = new mongoose.Schema(
  {
    items: {
      type: [materialItemSchema],
      default: () => DEFAULT_MATERIALS.map((m) => ({ ...m, totalEstimatedCost: m.plannedQuantity * m.unitRate })),
    },
    totalMaterialCost: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Planned Labour
const labourItemSchema = new mongoose.Schema({
  trade: { type: String, trim: true, required: true, maxlength: 160 },
  headcount: { type: Number, min: 0, default: 1 },
  ratePerDay: { type: Number, min: 0, default: 0 },
  plannedManDays: { type: Number, min: 0, default: 0 },
  totalEstimatedCost: { type: Number, min: 0, default: 0 },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const plannedLabourSchema = new mongoose.Schema(
  {
    items: {
      type: [labourItemSchema],
      default: () => DEFAULT_LABOUR_TRADES.map((l) => ({ ...l, totalEstimatedCost: l.plannedManDays * l.ratePerDay })),
    },
    totalLabourCost: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Planned Timeline
const milestoneItemSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 200 },
  durationDays: { type: Number, min: 1, default: 30 },
  weightagePercent: { type: Number, min: 0, max: 100, default: 10 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const plannedTimelineSchema = new mongoose.Schema(
  {
    plannedStartDate: { type: Date, default: null },
    plannedCompletionDate: { type: Date, default: null },
    totalDurationDays: { type: Number, min: 1, default: 365 },
    milestones: {
      type: [milestoneItemSchema],
      default: () => DEFAULT_TIMELINE_MILESTONES.map((t) => ({ ...t })),
    },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Planned Cashflow
const cashflowItemSchema = new mongoose.Schema({
  monthLabel: { type: String, trim: true, required: true, maxlength: 60 }, // 'Month 1', 'Month 2'
  targetMilestone: { type: String, trim: true, default: '', maxlength: 160 },
  materialOutflow: { type: Number, min: 0, default: 0 },
  labourOutflow: { type: Number, min: 0, default: 0 },
  contractorOutflow: { type: Number, min: 0, default: 0 },
  miscOutflow: { type: Number, min: 0, default: 0 },
  totalOutflow: { type: Number, min: 0, default: 0 },
});

const plannedCashflowSchema = new mongoose.Schema(
  {
    items: { type: [cashflowItemSchema], default: [] },
    totalCashflowPlanned: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// Baseline Freeze Governance Gate
const baselineHistorySchema = new mongoose.Schema({
  decision: { type: String, enum: ['approved', 'rejected'], required: true },
  note: { type: String, trim: true, default: '', maxlength: 2000 },
  budgetAtLock: { type: Number, min: 0, default: 0 },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  at: { type: Date, default: Date.now },
});

const baselineLockSchema = new mongoose.Schema(
  {
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    totalBaselineBudget: { type: Number, min: 0, default: 0 },
    lockNotes: { type: String, trim: true, default: '', maxlength: 2000 },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: null },
    decision: { type: String, enum: ['', 'approved', 'rejected'], default: '' },
    history: { type: [baselineHistorySchema], default: [] },
  },
  { _id: false }
);

const baselinePlanningSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // BSL-000001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true },

    status: { type: String, enum: BASELINE_STATUS, default: 'plannedMaterial', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    plannedMaterial: { type: plannedMaterialSchema, default: () => ({}) },
    plannedLabour: { type: plannedLabourSchema, default: () => ({}) },
    plannedTimeline: { type: plannedTimelineSchema, default: () => ({}) },
    plannedCashflow: { type: plannedCashflowSchema, default: () => ({}) },
    baselineLock: { type: baselineLockSchema, default: () => ({}) },

    notes: { type: String, trim: true, default: '', maxlength: 4000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

baselinePlanningSchema.pre('save', function deriveTotals(next) {
  // 1. Material
  if (this.plannedMaterial && Array.isArray(this.plannedMaterial.items)) {
    this.plannedMaterial.items.forEach((m) => {
      m.totalEstimatedCost = Math.round(((Number(m.plannedQuantity) || 0) * (Number(m.unitRate) || 0) + Number.EPSILON) * 100) / 100;
    });
    this.plannedMaterial.totalMaterialCost = this.plannedMaterial.items.reduce(
      (sum, m) => sum + (Number(m.totalEstimatedCost) || 0),
      0
    );
  }

  // 2. Labour
  if (this.plannedLabour && Array.isArray(this.plannedLabour.items)) {
    this.plannedLabour.items.forEach((l) => {
      l.totalEstimatedCost = Math.round(((Number(l.plannedManDays) || 0) * (Number(l.ratePerDay) || 0) + Number.EPSILON) * 100) / 100;
    });
    this.plannedLabour.totalLabourCost = this.plannedLabour.items.reduce(
      (sum, l) => sum + (Number(l.totalEstimatedCost) || 0),
      0
    );
  }

  // 3. Cashflow
  if (this.plannedCashflow && Array.isArray(this.plannedCashflow.items)) {
    this.plannedCashflow.items.forEach((c) => {
      c.totalOutflow =
        (Number(c.materialOutflow) || 0) +
        (Number(c.labourOutflow) || 0) +
        (Number(c.contractorOutflow) || 0) +
        (Number(c.miscOutflow) || 0);
    });
    this.plannedCashflow.totalCashflowPlanned = this.plannedCashflow.items.reduce(
      (sum, c) => sum + (Number(c.totalOutflow) || 0),
      0
    );
  }

  // 4. Baseline Lock Total Budget
  const totalMat = Number(this.plannedMaterial?.totalMaterialCost) || 0;
  const totalLab = Number(this.plannedLabour?.totalLabourCost) || 0;
  const totalCash = Number(this.plannedCashflow?.totalCashflowPlanned) || 0;
  this.baselineLock.totalBaselineBudget = Math.max(totalMat + totalLab, totalCash);

  next();
});

baselinePlanningSchema.index(
  { project: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('BaselinePlanning', baselinePlanningSchema);
