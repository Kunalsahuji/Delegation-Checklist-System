const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
require('./projectPlanning.model');
const {
  PRE_SITE_STATUS,
  CONTRACTOR_TRADES,
  CONTRACT_TYPES,
  DEFAULT_RATE_ITEMS,
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

// 1. Contractor Selection
const contractorSelectionSchema = new mongoose.Schema(
  {
    contractorName: { type: String, trim: true, default: '', maxlength: 200 },
    companyName: { type: String, trim: true, default: '', maxlength: 200 },
    trade: { type: String, enum: CONTRACTOR_TRADES, default: 'general' },
    contactPerson: { type: String, trim: true, default: '', maxlength: 160 },
    phone: { type: String, trim: true, default: '', maxlength: 40 },
    email: { type: String, trim: true, default: '', maxlength: 120 },
    gstNumber: { type: String, trim: true, default: '', maxlength: 40 },
    panNumber: { type: String, trim: true, default: '', maxlength: 40 },
    selectionDate: { type: Date, default: null },
    experienceYears: { type: Number, min: 0, default: 5 },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Rate Finalization
const rateItemSchema = new mongoose.Schema({
  itemDescription: { type: String, trim: true, required: true, maxlength: 250 },
  unit: { type: String, trim: true, required: true, maxlength: 40 },
  tenderRate: { type: Number, min: 0, default: 0 },
  agreedRate: { type: Number, min: 0, default: 0 },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const rateFinalizationSchema = new mongoose.Schema(
  {
    contractType: { type: String, enum: CONTRACT_TYPES, default: 'itemRate' },
    items: {
      type: [rateItemSchema],
      default: () => DEFAULT_RATE_ITEMS.map((r) => ({ ...r })),
    },
    negotiatedSavings: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Work Order (WO) Agreement
const workOrderSchema = new mongoose.Schema(
  {
    workOrderNumber: { type: String, trim: true, default: '', maxlength: 80 },
    issueDate: { type: Date, default: null },
    contractValue: { type: Number, min: 0, default: 0 },
    advanceAmount: { type: Number, min: 0, default: 0 },
    retentionPercent: { type: Number, min: 0, max: 100, default: 5 },
    completionMonths: { type: Number, min: 1, default: 12 },
    paymentTerms: { type: String, trim: true, default: 'Running account bills certified every 30 days with 5% retention.', maxlength: 2000 },
    documentUrl: { type: String, trim: true, default: '', maxlength: 500 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Site Setup & Mobilization
const setupFacilitySchema = new mongoose.Schema(
  {
    ready: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: false }
);

const siteSetupSchema = new mongoose.Schema(
  {
    siteEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    siteEngineerName: { type: String, trim: true, default: '', maxlength: 160 },
    siteEngineerContact: { type: String, trim: true, default: '', maxlength: 40 },
    waterConnection: { type: setupFacilitySchema, default: () => ({ ready: false, notes: '' }) },
    powerConnection: { type: setupFacilitySchema, default: () => ({ ready: false, notes: '' }) },
    barricading: { type: setupFacilitySchema, default: () => ({ ready: false, notes: '' }) },
    siteOffice: { type: setupFacilitySchema, default: () => ({ ready: false, notes: '' }) },
    storageGodown: { type: setupFacilitySchema, default: () => ({ ready: false, notes: '' }) },
    setupTargetDate: { type: Date, default: null },
    setupCompletedDate: { type: Date, default: null },
    ...sectionBase,
  },
  { _id: false }
);

// 5. Management Approval Gate
const approvalEntrySchema = new mongoose.Schema({
  decision: { type: String, enum: ['approved', 'rejected'], required: true },
  note: { type: String, trim: true, default: '', maxlength: 2000 },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  at: { type: Date, default: Date.now },
});

const managementApprovalSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: null },
    decision: { type: String, enum: ['', 'approved', 'rejected'], default: '' },
    note: { type: String, trim: true, default: '', maxlength: 2000 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    history: { type: [approvalEntrySchema], default: [] },
  },
  { _id: false }
);

const preSiteStartSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // PSS-000001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true },
    projectPlanning: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPlanning', default: null },

    status: { type: String, enum: PRE_SITE_STATUS, default: 'contractorSelection', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    contractorSelection: { type: contractorSelectionSchema, default: () => ({}) },
    rateFinalization: { type: rateFinalizationSchema, default: () => ({}) },
    workOrder: { type: workOrderSchema, default: () => ({}) },
    siteSetup: { type: siteSetupSchema, default: () => ({}) },
    managementApproval: { type: managementApprovalSchema, default: () => ({}) },

    notes: { type: String, trim: true, default: '', maxlength: 4000 },
    approvedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

preSiteStartSchema.index(
  { project: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('PreSiteStart', preSiteStartSchema);
