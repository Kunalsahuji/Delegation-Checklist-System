const mongoose = require('mongoose');
require('../../auth/models/user.model');
const {
  FEASIBILITY_STATUS,
  FEASIBILITY_VERDICTS,
  RISK_SEVERITIES,
} = require('../constants/pms.constants');

const riskSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true },
    severity: { type: String, enum: RISK_SEVERITIES, default: 'low' },
    mitigation: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const feasibilitySchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. FSB-001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true, index: true },
    plot: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true, index: true },
    costs: {
      landCost: { type: Number, min: 0, default: 0 },
      developmentCost: { type: Number, min: 0, default: 0 },
      approvalCost: { type: Number, min: 0, default: 0 },
      financeCost: { type: Number, min: 0, default: 0 },
      otherCost: { type: Number, min: 0, default: 0 },
      totalCost: { type: Number, min: 0, default: 0 }, // landCost + dev + approvals + finance + other
    },
    projections: {
      expectedRevenue: { type: Number, min: 0, default: 0 },
      expectedProfit: { type: Number, default: 0 }, // expectedRevenue - totalCost
      marginPct: { type: Number, default: 0 }, // (expectedProfit / expectedRevenue) * 100
      roiPct: { type: Number, default: 0 }, // (expectedProfit / totalCost) * 100
      paybackMonths: { type: Number, min: 0, default: 0 },
    },
    risks: { type: [riskSchema], default: [] },
    verdict: { type: String, enum: FEASIBILITY_VERDICTS, default: 'pending' },
    conditions: { type: String, trim: true, default: '' },
    status: { type: String, enum: FEASIBILITY_STATUS, default: 'draft', index: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

feasibilitySchema.index({ plot: 1, status: 1 });
feasibilitySchema.index({ project: 1, verdict: 1 });

module.exports = mongoose.model('Feasibility', feasibilitySchema);
