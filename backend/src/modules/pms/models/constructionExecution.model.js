const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  CONSTRUCTION_STATUS,
  WEATHER_CONDITIONS,
  SHIFTS,
  CONSTRUCTION_TRADES,
  QUALITY_CHECK_STATUS,
  PHOTO_CATEGORIES,
  MATERIAL_CATEGORIES,
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

// 1. Daily Progress Log (DPR)
const dprLogSchema = new mongoose.Schema({
  dprNumber: { type: String, trim: true, required: true, maxlength: 60 },
  date: { type: Date, default: Date.now },
  shift: { type: String, enum: SHIFTS, default: 'Day Shift' },
  weather: { type: String, enum: WEATHER_CONDITIONS, default: 'Clear' },
  temperature: { type: String, trim: true, default: '30°C', maxlength: 30 },
  workHours: { type: Number, min: 0, default: 8 },
  siteEngineer: { type: String, trim: true, default: '', maxlength: 120 },
  plannedActivities: { type: String, trim: true, default: '', maxlength: 1500 },
  completedActivities: { type: String, trim: true, default: '', maxlength: 1500 },
  delaysOrBlockers: { type: String, trim: true, default: 'None', maxlength: 1000 },
  siteSafetyIncidents: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['draft', 'submitted', 'verified'], default: 'submitted' },
});

const dailyProgressSchema = new mongoose.Schema(
  {
    dprLogs: { type: [dprLogSchema], default: [] },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Labour Tracking
const labourEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  contractorName: { type: String, trim: true, required: true, maxlength: 160 },
  trade: { type: String, enum: CONSTRUCTION_TRADES, default: 'Civil & Masonry' },
  headCount: { type: Number, min: 1, default: 1 },
  hoursPerWorker: { type: Number, min: 1, default: 8 },
  totalManHours: { type: Number, min: 0, default: 8 },
  dailyWageRate: { type: Number, min: 0, default: 700 },
  totalLabourCost: { type: Number, min: 0, default: 700 },
  supervisor: { type: String, trim: true, default: '', maxlength: 120 },
  verified: { type: Boolean, default: true },
});

const labourTrackingSchema = new mongoose.Schema(
  {
    labourEntries: { type: [labourEntrySchema], default: [] },
    totalManHours: { type: Number, min: 0, default: 0 },
    totalLabourCost: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Material Consumption
const consumptionEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  materialName: { type: String, trim: true, required: true, maxlength: 160 },
  category: { type: String, enum: MATERIAL_CATEGORIES, default: 'cement' },
  unit: { type: String, trim: true, default: 'Units', maxlength: 40 },
  quantityConsumed: { type: Number, min: 0, default: 0 },
  unitRate: { type: Number, min: 0, default: 0 },
  totalCost: { type: Number, min: 0, default: 0 },
  locationOrElement: { type: String, trim: true, default: '', maxlength: 200 },
  stockLedgerRef: { type: String, trim: true, default: '', maxlength: 100 },
  verifiedBy: { type: String, trim: true, default: '', maxlength: 120 },
});

const materialConsumptionSchema = new mongoose.Schema(
  {
    consumptionEntries: { type: [consumptionEntrySchema], default: [] },
    totalMaterialCost: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Quality & Site Photos
const qualityInspectionSchema = new mongoose.Schema({
  inspectionDate: { type: Date, default: Date.now },
  elementOrLocation: { type: String, trim: true, required: true, maxlength: 200 },
  stage: { type: String, trim: true, default: '', maxlength: 160 },
  checkedBy: { type: String, trim: true, default: '', maxlength: 120 },
  verdict: { type: String, enum: QUALITY_CHECK_STATUS, default: 'Passed' },
  remedialAction: { type: String, trim: true, default: 'N/A', maxlength: 500 },
  signOffEngineer: { type: String, trim: true, default: '', maxlength: 120 },
});

const sitePhotoSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  title: { type: String, trim: true, required: true, maxlength: 200 },
  category: { type: String, enum: PHOTO_CATEGORIES, default: 'RCC Structural Work' },
  locationTag: { type: String, trim: true, default: '', maxlength: 160 },
  imageUrl: { type: String, trim: true, default: '', maxlength: 800 },
  capturedBy: { type: String, trim: true, default: '', maxlength: 120 },
  notes: { type: String, trim: true, default: '', maxlength: 500 },
});

const qualitySitePhotosSchema = new mongoose.Schema(
  {
    qualityInspections: { type: [qualityInspectionSchema], default: [] },
    sitePhotos: { type: [sitePhotoSchema], default: [] },
    passRatePercent: { type: Number, min: 0, max: 100, default: 100 },
    ...sectionBase,
  },
  { _id: false }
);

const constructionExecutionSchema = new mongoose.Schema(
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
      enum: CONSTRUCTION_STATUS,
      default: 'siteMobilized',
      index: true,
    },
    dailyProgress: { type: dailyProgressSchema, default: () => ({}) },
    labourTracking: { type: labourTrackingSchema, default: () => ({}) },
    materialConsumption: { type: materialConsumptionSchema, default: () => ({}) },
    qualitySitePhotos: { type: qualitySitePhotosSchema, default: () => ({}) },
    totalDprCount: { type: Number, min: 0, default: 0 },
    totalManHours: { type: Number, min: 0, default: 0 },
    totalLabourCost: { type: Number, min: 0, default: 0 },
    totalMaterialCost: { type: Number, min: 0, default: 0 },
    totalPhotosCount: { type: Number, min: 0, default: 0 },
    overallPassRate: { type: Number, min: 0, max: 100, default: 100 },
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

constructionExecutionSchema.index({ project: 1, status: 1 });

const ConstructionExecution = mongoose.model('ConstructionExecution', constructionExecutionSchema);

module.exports = ConstructionExecution;
