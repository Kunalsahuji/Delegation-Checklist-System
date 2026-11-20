const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  QUALITY_STATUS,
  INSPECTION_STAGES,
  SNAG_SEVERITIES,
  SNAG_STATUS,
  SNAG_CATEGORIES,
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

// 1. Stage Inspection Schema
const inspectionItemSchema = new mongoose.Schema({
  stage: { type: String, enum: INSPECTION_STAGES, default: 'RCC Superstructure & Slab Casting' },
  locationOrElement: { type: String, trim: true, required: true, maxlength: 200 },
  inspectionDate: { type: Date, default: Date.now },
  inspector: { type: String, trim: true, default: 'Er. Sandeep Rathore', maxlength: 120 },
  standardCode: { type: String, trim: true, default: 'IS 456:2000', maxlength: 60 },
  tolerancePermitted: { type: String, trim: true, default: '±3mm', maxlength: 60 },
  toleranceMeasured: { type: String, trim: true, default: '+1.5mm', maxlength: 60 },
  result: { type: String, enum: ['Pass', 'Conditional Pass', 'Fail'], default: 'Pass' },
  notes: { type: String, trim: true, default: '', maxlength: 800 },
  photoUrl: { type: String, trim: true, default: '', maxlength: 800 },
});

const stageInspectionSchema = new mongoose.Schema(
  {
    inspections: { type: [inspectionItemSchema], default: [] },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Engineer Approval Schema
const verificationItemSchema = new mongoose.Schema({
  criteria: { type: String, trim: true, required: true, maxlength: 200 },
  verified: { type: Boolean, default: true },
  engineerRemarks: { type: String, trim: true, default: '', maxlength: 500 },
  verifiedDate: { type: Date, default: Date.now },
});

const engineerApprovalSchema = new mongoose.Schema(
  {
    checklistVerifications: { type: [verificationItemSchema], default: [] },
    leadEngineerName: { type: String, trim: true, default: 'Er. Sandeep Rathore', maxlength: 120 },
    signOffVerdict: { type: String, enum: ['Approved', 'Conditional', 'Rejected'], default: 'Approved' },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Snag List Schema
const snagItemSchema = new mongoose.Schema({
  snagCode: { type: String, trim: true, required: true, maxlength: 40 },
  category: { type: String, enum: SNAG_CATEGORIES, default: 'Civil & Structural' },
  description: { type: String, trim: true, required: true, maxlength: 500 },
  location: { type: String, trim: true, required: true, maxlength: 200 },
  severity: { type: String, enum: SNAG_SEVERITIES, default: 'Medium' },
  assignedContractor: { type: String, trim: true, default: '', maxlength: 160 },
  targetDate: { type: Date, default: null },
  status: { type: String, enum: SNAG_STATUS, default: 'identified' },
  photoBefore: { type: String, trim: true, default: '', maxlength: 800 },
  dateIdentified: { type: Date, default: Date.now },
});

const snagListSchema = new mongoose.Schema(
  {
    snags: { type: [snagItemSchema], default: [] },
    totalSnagsCount: { type: Number, min: 0, default: 0 },
    openSnagsCount: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Rectification & Closure Schema
const closureItemSchema = new mongoose.Schema({
  snagCode: { type: String, trim: true, required: true, maxlength: 40 },
  rectificationDate: { type: Date, default: Date.now },
  contractorNotes: { type: String, trim: true, default: '', maxlength: 600 },
  photoAfter: { type: String, trim: true, default: '', maxlength: 800 },
  verifiedBy: { type: String, trim: true, default: '', maxlength: 120 },
  isApprovedClosure: { type: Boolean, default: true },
  closureNotes: { type: String, trim: true, default: '', maxlength: 600 },
});

const rectificationSchema = new mongoose.Schema(
  {
    closures: { type: [closureItemSchema], default: [] },
    rectifiedCount: { type: Number, min: 0, default: 0 },
    closureRatePercent: { type: Number, min: 0, max: 100, default: 100 },
    ...sectionBase,
  },
  { _id: false }
);

const qualityControlSchema = new mongoose.Schema(
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
      enum: QUALITY_STATUS,
      default: 'inspectionPending',
      index: true,
    },
    stageInspection: { type: stageInspectionSchema, default: () => ({}) },
    engineerApproval: { type: engineerApprovalSchema, default: () => ({}) },
    snagList: { type: snagListSchema, default: () => ({}) },
    rectification: { type: rectificationSchema, default: () => ({}) },
    totalInspectionsCount: { type: Number, min: 0, default: 0 },
    inspectionPassRate: { type: Number, min: 0, max: 100, default: 100 },
    totalSnags: { type: Number, min: 0, default: 0 },
    openSnags: { type: Number, min: 0, default: 0 },
    rectifiedSnags: { type: Number, min: 0, default: 0 },
    snagClosureRate: { type: Number, min: 0, max: 100, default: 100 },
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

qualityControlSchema.index({ project: 1, status: 1 });

const QualityControl = mongoose.model('QualityControl', qualityControlSchema);

module.exports = QualityControl;
