const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
require('./plot.model');
require('./landPurchase.model');
const {
  PROJECT_TYPES,
  PROJECT_PLANNING_STATUS,
  PLANNING_SECTION_STATUS,
  PLANNING_DECISIONS,
  ROAD_CATEGORIES,
  ROAD_SURFACES,
  FACING_DIRECTIONS,
  UNIT_KINDS,
  AREA_UNITS,
  PLANNING_AMENITY_ITEMS,
} = require('../constants/pms.constants');

const sectionBase = {
  status: { type: String, enum: PLANNING_SECTION_STATUS, default: 'pending' },
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

// 1. Survey
const surveySchema = new mongoose.Schema(
  {
    surveyNumber: { type: String, trim: true, default: '', maxlength: 80 },
    surveyDate: { type: Date, default: null },
    agencyName: { type: String, trim: true, default: '', maxlength: 200 },
    surveyorName: { type: String, trim: true, default: '', maxlength: 160 },
    surveyorContact: { type: String, trim: true, default: '', maxlength: 40 },
    boundaries: {
      north: { type: String, trim: true, default: '', maxlength: 200 },
      south: { type: String, trim: true, default: '', maxlength: 200 },
      east: { type: String, trim: true, default: '', maxlength: 200 },
      west: { type: String, trim: true, default: '', maxlength: 200 },
    },
    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    surveyedArea: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Master Layout
const masterLayoutSchema = new mongoose.Schema(
  {
    layoutNumber: { type: String, trim: true, default: '', maxlength: 80 },
    version: { type: String, trim: true, default: 'R1', maxlength: 40 },
    architect: { type: String, trim: true, default: '', maxlength: 200 },
    preparedOn: { type: Date, default: null },
    totalArea: { type: Number, min: 0, default: 0 },
    saleableArea: { type: Number, min: 0, default: 0 },
    roadArea: { type: Number, min: 0, default: 0 },
    openArea: { type: Number, min: 0, default: 0 },
    utilityArea: { type: Number, min: 0, default: 0 },
    commonArea: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Roads
const roadSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 120 },
  category: { type: String, enum: ROAD_CATEGORIES, default: 'internal' },
  surface: { type: String, enum: ROAD_SURFACES, default: 'bt' },
  widthFt: { type: Number, min: 0, max: 500, default: 30 },
  lengthFt: { type: Number, min: 0, default: 0 },
  hasDrainage: { type: Boolean, default: true },
  drainageType: { type: String, trim: true, default: 'underground', maxlength: 80 },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const roadPlanningSchema = new mongoose.Schema(
  {
    roads: { type: [roadSchema], default: [] },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Amenities
const amenityItemSchema = new mongoose.Schema({
  key: { type: String, trim: true, required: true, maxlength: 80 },
  label: { type: String, trim: true, required: true, maxlength: 200 },
  included: { type: Boolean, default: false },
  count: { type: Number, min: 0, default: 1 },
  area: { type: Number, min: 0, default: 0 },
  capacity: { type: String, trim: true, default: '', maxlength: 80 },
  estimatedCost: { type: Number, min: 0, default: 0 },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const amenitiesSchema = new mongoose.Schema(
  {
    items: {
      type: [amenityItemSchema],
      default: () => PLANNING_AMENITY_ITEMS.map((a) => ({ ...a, included: true, count: 1, area: 0, estimatedCost: 0 })),
    },
    ...sectionBase,
  },
  { _id: false }
);

// 5. Plot / Villa Planning
const unitCategorySchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 120 }, // '30x50 East Facing Villa'
  kind: { type: String, enum: UNIT_KINDS, default: 'plot' },
  count: { type: Number, min: 0, default: 0 },
  area: { type: Number, min: 0, default: 0 },
  widthFt: { type: Number, min: 0, default: 0 },
  depthFt: { type: Number, min: 0, default: 0 },
  facing: { type: String, enum: ['', ...FACING_DIRECTIONS], default: 'east' },
  remarks: { type: String, trim: true, default: '', maxlength: 500 },
});

const plotVillaPlanningSchema = new mongoose.Schema(
  {
    totalPlots: { type: Number, min: 0, default: 0 },
    totalVillas: { type: Number, min: 0, default: 0 },
    categories: { type: [unitCategorySchema], default: [] },
    ...sectionBase,
  },
  { _id: false }
);

// 6. Budget
const budgetSchema = new mongoose.Schema(
  {
    landDevelopmentCost: { type: Number, min: 0, default: 0 },
    roadsCost: { type: Number, min: 0, default: 0 },
    utilitiesCost: { type: Number, min: 0, default: 0 },
    amenitiesCost: { type: Number, min: 0, default: 0 },
    infrastructureCost: { type: Number, min: 0, default: 0 },
    miscCost: { type: Number, min: 0, default: 0 },
    totalEstimatedCost: { type: Number, min: 0, default: 0 },
    basis: { type: String, trim: true, default: '', maxlength: 2000 },
    preparedBy: { type: String, trim: true, default: '', maxlength: 160 },
    preparedOn: { type: Date, default: null },
    ...sectionBase,
  },
  { _id: false }
);

// Management Approval Gate
const approvalEntrySchema = new mongoose.Schema({
  decision: { type: String, enum: PLANNING_DECISIONS, required: true },
  note: { type: String, trim: true, default: '', maxlength: 2000 },
  budgetAtDecision: { type: Number, min: 0, default: 0 },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  at: { type: Date, default: Date.now },
});

const managementApprovalSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: null },
    decision: { type: String, enum: ['', ...PLANNING_DECISIONS], default: '' },
    note: { type: String, trim: true, default: '', maxlength: 2000 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    history: { type: [approvalEntrySchema], default: [] },
  },
  { _id: false }
);

const projectPlanningSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // PLN-000001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true },
    plot: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', default: null },
    landPurchase: { type: mongoose.Schema.Types.ObjectId, ref: 'LandPurchase', default: null },
    feasibility: { type: mongoose.Schema.Types.ObjectId, ref: 'Feasibility', default: null },

    projectType: { type: String, enum: PROJECT_TYPES, default: 'plotting', index: true },
    areaUnit: { type: String, enum: AREA_UNITS, default: 'sqyd' },

    landAreaSnapshot: {
      value: { type: Number, min: 0, default: 0 },
      unit: { type: String, enum: AREA_UNITS, default: 'sqyd' },
    },

    estimatedDevelopmentCost: { type: Number, min: 0, default: 0 },

    status: { type: String, enum: PROJECT_PLANNING_STATUS, default: 'survey', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    survey: { type: surveySchema, default: () => ({}) },
    masterLayout: { type: masterLayoutSchema, default: () => ({}) },
    roadPlanning: { type: roadPlanningSchema, default: () => ({}) },
    amenities: { type: amenitiesSchema, default: () => ({}) },
    plotVillaPlanning: { type: plotVillaPlanningSchema, default: () => ({}) },
    budget: { type: budgetSchema, default: () => ({}) },
    managementApproval: { type: managementApprovalSchema, default: () => ({}) },

    notes: { type: String, trim: true, default: '', maxlength: 4000 },
    approvedAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true, default: '', maxlength: 1000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

projectPlanningSchema.pre('save', function deriveBudgetTotal(next) {
  const b = this.budget || {};
  const sum = [
    'landDevelopmentCost',
    'roadsCost',
    'utilitiesCost',
    'amenitiesCost',
    'infrastructureCost',
    'miscCost',
  ].reduce((total, key) => total + (Number(b[key]) || 0), 0);
  this.budget.totalEstimatedCost = Math.round((sum + Number.EPSILON) * 100) / 100;
  next();
});

projectPlanningSchema.index(
  { project: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('ProjectPlanning', projectPlanningSchema);
