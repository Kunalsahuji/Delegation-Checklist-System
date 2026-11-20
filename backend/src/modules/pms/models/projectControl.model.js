const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  PROJECT_CONTROL_STATUS,
  VARIANCE_TYPES,
  SCHEDULE_STATUSES,
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

// 1. Material Variance Schema
const materialVarianceItemSchema = new mongoose.Schema({
  materialName: { type: String, trim: true, required: true, maxlength: 160 },
  category: { type: String, trim: true, default: 'cement', maxlength: 60 },
  unit: { type: String, trim: true, default: 'Bags', maxlength: 40 },
  baselineQty: { type: Number, min: 0, default: 0 },
  actualQty: { type: Number, min: 0, default: 0 },
  qtyVariance: { type: Number, default: 0 },
  baselineRate: { type: Number, min: 0, default: 0 },
  actualRate: { type: Number, min: 0, default: 0 },
  rateVariance: { type: Number, default: 0 },
  baselineCost: { type: Number, min: 0, default: 0 },
  actualCost: { type: Number, min: 0, default: 0 },
  costVariance: { type: Number, default: 0 },
  varianceType: { type: String, enum: VARIANCE_TYPES, default: 'Neutral' },
  remarks: { type: String, trim: true, default: '', maxlength: 400 },
});

const materialVarianceSchema = new mongoose.Schema(
  {
    items: { type: [materialVarianceItemSchema], default: [] },
    totalBaselineMaterialCost: { type: Number, min: 0, default: 0 },
    totalActualMaterialCost: { type: Number, min: 0, default: 0 },
    netMaterialVariance: { type: Number, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Labour Variance Schema
const labourVarianceItemSchema = new mongoose.Schema({
  trade: { type: String, trim: true, required: true, maxlength: 160 },
  contractorName: { type: String, trim: true, default: '', maxlength: 160 },
  baselineManHours: { type: Number, min: 0, default: 0 },
  actualManHours: { type: Number, min: 0, default: 0 },
  manHoursVariance: { type: Number, default: 0 },
  baselineRate: { type: Number, min: 0, default: 0 },
  actualRate: { type: Number, min: 0, default: 0 },
  baselineCost: { type: Number, min: 0, default: 0 },
  actualCost: { type: Number, min: 0, default: 0 },
  costVariance: { type: Number, default: 0 },
  varianceType: { type: String, enum: VARIANCE_TYPES, default: 'Neutral' },
  remarks: { type: String, trim: true, default: '', maxlength: 400 },
});

const labourVarianceSchema = new mongoose.Schema(
  {
    items: { type: [labourVarianceItemSchema], default: [] },
    totalBaselineLabourCost: { type: Number, min: 0, default: 0 },
    totalActualLabourCost: { type: Number, min: 0, default: 0 },
    netLabourVariance: { type: Number, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Time Variance Schema
const timeMilestoneSchema = new mongoose.Schema({
  milestoneName: { type: String, trim: true, required: true, maxlength: 200 },
  baselineStart: { type: Date, default: null },
  baselineEnd: { type: Date, default: null },
  actualStart: { type: Date, default: null },
  actualEnd: { type: Date, default: null },
  varianceDays: { type: Number, default: 0 },
  status: { type: String, enum: SCHEDULE_STATUSES, default: 'On Schedule' },
  criticalPathImpact: { type: Boolean, default: false },
  mitigationAction: { type: String, trim: true, default: '', maxlength: 500 },
});

const timeVarianceSchema = new mongoose.Schema(
  {
    milestones: { type: [timeMilestoneSchema], default: [] },
    overallScheduleDelayDays: { type: Number, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Cost Variance Schema
const costVarianceSchema = new mongoose.Schema(
  {
    baselineBudgetTotal: { type: Number, min: 0, default: 0 },
    actualCostToDate: { type: Number, min: 0, default: 0 },
    costVarianceAmount: { type: Number, default: 0 },
    cpi: { type: Number, min: 0, default: 1.0 },
    spi: { type: Number, min: 0, default: 1.0 },
    estimateAtCompletion: { type: Number, min: 0, default: 0 },
    costStatus: {
      type: String,
      enum: ['Within Budget', 'Moderate Overrun', 'Critical Overrun'],
      default: 'Within Budget',
    },
    mitigationPlan: { type: String, trim: true, default: '', maxlength: 1000 },
    ...sectionBase,
  },
  { _id: false }
);

const projectControlSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, unique: true, required: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PmsProject',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: PROJECT_CONTROL_STATUS,
      default: 'monitoring',
      index: true,
    },
    materialVariance: { type: materialVarianceSchema, default: () => ({}) },
    labourVariance: { type: labourVarianceSchema, default: () => ({}) },
    timeVariance: { type: timeVarianceSchema, default: () => ({}) },
    costVariance: { type: costVarianceSchema, default: () => ({}) },
    overallCostVariance: { type: Number, default: 0 },
    isWithinBudget: { type: Boolean, default: true },
    isScheduleDelayed: { type: Boolean, default: false },
    cpi: { type: Number, min: 0, default: 1.0 },
    spi: { type: Number, min: 0, default: 1.0 },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: '', maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

projectControlSchema.index({ project: 1, status: 1 });

const ProjectControl = mongoose.model('ProjectControl', projectControlSchema);

module.exports = ProjectControl;
