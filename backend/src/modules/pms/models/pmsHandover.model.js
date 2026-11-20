const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  HANDOVER_STATUS,
  CLEANING_CHECKLIST_ITEMS,
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

// 1. Final Inspection Schema
const finalInspectionSchema = new mongoose.Schema(
  {
    inspectorName: { type: String, trim: true, default: 'Er. Sandeep Rathore', maxlength: 120 },
    inspectionDate: { type: Date, default: Date.now },
    structuralIntegrityApproved: { type: Boolean, default: false },
    mepServicesCertified: { type: Boolean, default: false },
    finishingApproved: { type: Boolean, default: false },
    allInspectionsCleared: { type: Boolean, default: false },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Snag Closure Schema
const snagClosureSchema = new mongoose.Schema(
  {
    totalSnagsIdentified: { type: Number, min: 0, default: 0 },
    snagsRectified: { type: Number, min: 0, default: 0 },
    pendingSnags: { type: Number, min: 0, default: 0 },
    zeroSnagCertificateIssued: { type: Boolean, default: false },
    deSnaggingEngineer: { type: String, trim: true, default: 'Er. Rajesh Kumar', maxlength: 120 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Deep Cleaning Schema
const cleaningAreaSchema = new mongoose.Schema(
  {
    area: { type: String, trim: true, required: true, maxlength: 160 },
    status: { type: String, enum: ['pending', 'inProgress', 'completed'], default: 'pending' },
    cleanedAt: { type: Date, default: null },
    inspectedBy: { type: String, trim: true, default: 'Deep Cleaning Supervisor', maxlength: 120 },
  },
  { _id: false }
);

const deepCleaningSchema = new mongoose.Schema(
  {
    areasCleaned: { type: [cleaningAreaSchema], default: [] },
    deepCleaningContractor: { type: String, trim: true, default: 'Sparkle Facilities & Services', maxlength: 160 },
    signOffDate: { type: Date, default: null },
    allAreasCleaned: { type: Boolean, default: false },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Customer Handover Schema
const customerHandoverSchema = new mongoose.Schema(
  {
    customerName: { type: String, trim: true, default: '', maxlength: 160 },
    unitNumber: { type: String, trim: true, default: '', maxlength: 60 },
    possessionLetterIssued: { type: Boolean, default: false },
    keysHandedOver: { type: Boolean, default: false },
    meterReadings: {
      electricity: { type: String, trim: true, default: '0000 kWh' },
      water: { type: String, trim: true, default: '0000 L' },
    },
    welcomeKitHanded: { type: Boolean, default: false },
    handoverDate: { type: Date, default: null },
    satisfactionRating: { type: Number, min: 1, max: 5, default: 5 },
    ...sectionBase,
  },
  { _id: false }
);

const pmsHandoverSchema = new mongoose.Schema(
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
      enum: HANDOVER_STATUS,
      default: 'preHandoverInspection',
      index: true,
    },
    finalInspection: { type: finalInspectionSchema, default: () => ({}) },
    snagClosure: { type: snagClosureSchema, default: () => ({}) },
    deepCleaning: { type: deepCleaningSchema, default: () => ({}) },
    customerHandover: { type: customerHandoverSchema, default: () => ({}) },
    
    // Aggregates for high-speed indexing & KPI queries
    possessionCompleted: { type: Boolean, default: false, index: true },
    zeroSnagVerified: { type: Boolean, default: false, index: true },
    pendingSnagsCount: { type: Number, min: 0, default: 0, index: true },
    inspectionsCleared: { type: Boolean, default: false, index: true },

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

pmsHandoverSchema.index({ project: 1, status: 1 });

const PmsHandover = mongoose.model('PmsHandover', pmsHandoverSchema);

module.exports = PmsHandover;
