const mongoose = require('mongoose');

const LEAD_STATUS = {
  ACTIVE: 'active',
  WON: 'won',
  LOST: 'lost',
  DROPPED: 'dropped',
};

const LEAD_TEMPERATURE = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
};

const leadSchema = new mongoose.Schema(
  {
    leadNumber: { type: String, unique: true, index: true },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      default: null,
      index: true,
    },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true, index: true },
    alternatePhone: { type: String, trim: true, default: '' },
    clientEmail: { type: String, trim: true, lowercase: true, default: '' },
    city: { type: String, trim: true, default: '' },

    currentStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeadStage',
      required: true,
      index: true,
    },
    currentStageName: { type: String, trim: true, default: '' },
    currentStageOrder: { type: Number, default: 1, index: true },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedAt: { type: Date, default: null },

    visitAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visitAssignedAt: { type: Date, default: null },

    temperature: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
      index: true,
    },
    source: {
      type: String,
      default: 'phone',
      index: true,
    },
    project: { type: String, trim: true, default: '' },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    propertyType: {
      type: String,
      enum: ['plot', 'villa', 'apartment', 'commercial', 'farmhouse', 'any'],
      default: 'plot',
    },
    budget: { type: Number, min: 0, default: 0 },
    expectedRevenue: { type: Number, min: 0, default: 0 },
    actualValue: { type: Number, min: 0, default: null },
    yards: { type: Number, min: 0, default: 0 },

    // Deal finalization
    finalizedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    finalizedProjectName: { type: String, trim: true, default: '' },
    finalizedUnitId: { type: mongoose.Schema.Types.ObjectId, default: null },
    finalizedUnitNumber: { type: String, trim: true, default: '' },

    status: {
      type: String,
      enum: ['active', 'won', 'lost', 'dropped'],
      default: 'active',
      index: true,
    },
    lostReason: { type: String, trim: true, default: '' },
    dropReason: { type: String, trim: true, default: '' },
    closedAt: { type: Date, default: null },
    droppedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    plannedStageAt: { type: Date, default: null },
    actualStageAt: { type: Date, default: Date.now },
    nextFollowupAt: { type: Date, default: null, index: true },
    followupTime: { type: String, trim: true, default: '' },
    specialFollowUp: { type: Boolean, default: false, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },

    isWalkIn: { type: Boolean, default: false, index: true },
    notes: { type: String, trim: true, default: '' },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ currentStageId: 1, status: 1 });
leadSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
module.exports.LEAD_STATUS = LEAD_STATUS;
module.exports.LEAD_TEMPERATURE = LEAD_TEMPERATURE;
