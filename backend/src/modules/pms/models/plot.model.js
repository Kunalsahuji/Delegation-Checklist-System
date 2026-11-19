const mongoose = require('mongoose');
require('../../auth/models/user.model');
const { PLOT_STATUS, AREA_UNITS, PLOT_SOURCES, ZONING_TYPES } = require('../constants/pms.constants');

const brokerInfoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    agencyName: { type: String, trim: true, default: '' },
    commissionPct: { type: Number, min: 0, default: 0 },
    remarks: { type: String, trim: true, default: '' },
  },
  { _id: false }
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

const plotSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. PLT-001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true, index: true },
    title: { type: String, required: true, trim: true },
    surveyNumber: { type: String, trim: true, default: '' },
    location: {
      address: { type: String, trim: true, default: '' },
      village: { type: String, trim: true, default: '' },
      tehsil: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: 'Jaipur' },
      state: { type: String, trim: true, default: 'Rajasthan' },
      pincode: { type: String, trim: true, default: '' },
      geo: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    area: {
      value: { type: Number, required: true, min: 0 },
      unit: { type: String, enum: AREA_UNITS, default: 'sqyd' },
    },
    expectedRatePerUnit: { type: Number, min: 0, default: 0 },
    expectedTotalPrice: { type: Number, min: 0, default: 0 },
    owner: {
      name: { type: String, required: true, trim: true },
      contact: { type: String, trim: true, default: '' },
    },
    source: { type: String, enum: PLOT_SOURCES, default: 'broker' },
    broker: { type: brokerInfoSchema, default: () => ({}) },
    zoning: { type: String, enum: ZONING_TYPES, default: 'residential' },
    assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    status: { type: String, enum: PLOT_STATUS, default: 'identified', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

plotSchema.index({ project: 1, status: 1 });
plotSchema.index({ title: 'text', surveyNumber: 'text', code: 'text' });

module.exports = mongoose.model('Plot', plotSchema);
