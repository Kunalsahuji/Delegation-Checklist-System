const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
require('./plot.model');
const {
  LEGAL_CASE_STATUS,
  LEGAL_SECTION_STATUS,
  LEGAL_ITEM_STATUS,
  ENCUMBRANCE_ITEM_STATUS,
  LEGAL_RECOMMENDATIONS,
  LEGAL_DECISIONS,
  RISK_SEVERITIES,
} = require('../constants/pms.constants');

const checklistItem = (statuses) =>
  new mongoose.Schema(
    {
      key: { type: String, required: true, trim: true },
      label: { type: String, required: true, trim: true },
      status: { type: String, enum: statuses, default: 'pending' },
      remarks: { type: String, trim: true, default: '', maxlength: 1000 },
    },
    { _id: false }
  );

const sectionBase = {
  status: { type: String, enum: LEGAL_SECTION_STATUS, default: 'pending' },
  remarks: { type: String, trim: true, default: '', maxlength: 2000 },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date, default: null },
};

const titleVerificationSchema = new mongoose.Schema(
  { ...sectionBase, items: { type: [checklistItem(LEGAL_ITEM_STATUS)], default: [] } },
  { _id: false }
);

const encumbranceCheckSchema = new mongoose.Schema(
  {
    ...sectionBase,
    items: { type: [checklistItem(ENCUMBRANCE_ITEM_STATUS)], default: [] },
    riskLevel: { type: String, enum: ['', ...RISK_SEVERITIES], default: '' },
  },
  { _id: false }
);

const documentCheckItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    answer: { type: String, enum: ['', 'yes', 'no'], default: '' },
    remarks: { type: String, trim: true, default: '', maxlength: 1000 },
  },
  { _id: false }
);

const documentVerificationSchema = new mongoose.Schema(
  { ...sectionBase, items: { type: [documentCheckItemSchema], default: [] } },
  { _id: false }
);

const legalOpinionSchema = new mongoose.Schema(
  {
    ...sectionBase,
    advocateName: { type: String, trim: true, default: '' },
    advocateContact: { type: String, trim: true, default: '' },
    opinion: { type: String, trim: true, default: '', maxlength: 5000 },
    recommendation: { type: String, enum: ['', ...LEGAL_RECOMMENDATIONS], default: '' },
    riskCategory: { type: String, enum: ['', ...RISK_SEVERITIES], default: '' },
    suggestedAction: { type: String, trim: true, default: '', maxlength: 2000 },
    signature: { type: String, trim: true, default: '' },
    signedAt: { type: Date, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    internal: { type: Boolean, default: false },
  },
  { _id: false }
);

const approvalEntrySchema = new mongoose.Schema(
  {
    decision: { type: String, enum: LEGAL_DECISIONS, required: true },
    note: { type: String, trim: true, default: '', maxlength: 2000 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, default: '' },
    to: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const legalCaseSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // LEG-000001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true, index: true },
    plot: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    feasibility: { type: mongoose.Schema.Types.ObjectId, ref: 'Feasibility', default: null },

    lawyer: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
      name: { type: String, trim: true, default: '' },
      mobile: { type: String, trim: true, default: '' },
      firmName: { type: String, trim: true, default: '' },
    },

    status: { type: String, enum: LEGAL_CASE_STATUS, default: 'titleVerification', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    titleVerification: { type: titleVerificationSchema, default: () => ({}) },
    encumbranceCheck: { type: encumbranceCheckSchema, default: () => ({}) },
    documentVerification: { type: documentVerificationSchema, default: () => ({}) },
    legalOpinion: { type: legalOpinionSchema, default: () => ({}) },

    // Derived risk roll-up
    risk: {
      level: { type: String, enum: ['', ...RISK_SEVERITIES], default: 'low' },
      score: { type: Number, min: 0, default: 0 },
      adverseCount: { type: Number, min: 0, default: 0 },
      reasons: { type: [String], default: [] },
      computedAt: { type: Date, default: null },
    },

    approval: {
      decision: { type: String, enum: ['', ...LEGAL_DECISIONS], default: '' },
      note: { type: String, trim: true, default: '', maxlength: 2000 },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null },
      history: { type: [approvalEntrySchema], default: [] },
    },

    notes: { type: String, trim: true, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

legalCaseSchema.index({ project: 1, status: 1 });
legalCaseSchema.index(
  { plot: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('LegalCase', legalCaseSchema);
