const mongoose = require('mongoose');
const { PMS_PROJECT_STATUS } = require('../constants/pms.constants');

// Model name is PmsProject (NOT Project) — 'Project' is registered by the CRM's
// real-estate sales project model and the two must never collide.

const checklistItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    auto: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sourceRef: {
      model: { type: String, trim: true, default: '' },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
  },
  { _id: false }
);

const stageDocSchema = new mongoose.Schema(
  {
    slot: { type: String, trim: true, default: '' },
    fileName: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    s3Key: { type: String, trim: true, default: '' },
    contentType: { type: String, trim: true, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const stageSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, min: 1, max: 13 },
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true, default: '' },
    checklist: { type: [checklistItemSchema], default: [] },
    docs: { type: [stageDocSchema], default: [] },
    docSlots: { type: [String], default: [] },
    locksBaseline: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const pmsProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, trim: true, default: '', maxlength: 160 },
    code: { type: String, trim: true, default: '', uppercase: true },
    locality: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    plannedBudget: { type: Number, min: 0, default: 0 },
    actualSpend: { type: Number, min: 0, default: 0 },
    totalVillas: { type: Number, min: 0, default: 0 },
    totalPlots: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: null },
    targetCompletionAt: { type: Date, default: null },
    status: { type: String, enum: PMS_PROJECT_STATUS, default: 'planning' },
    stageOrder: { type: Number, min: 1, max: 13, default: 1 },
    baselineLocked: { type: Boolean, default: false },
    selectedPlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', default: null },
    pendingSiteEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    stages: { type: [stageSchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

pmsProjectSchema.index({ status: 1 });
pmsProjectSchema.index({ stageOrder: 1 });
pmsProjectSchema.index({ name: 'text', locality: 'text', city: 'text', code: 'text' });

module.exports = mongoose.model('PmsProject', pmsProjectSchema);
