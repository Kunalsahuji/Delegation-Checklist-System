const mongoose = require('mongoose');

const ENQUIRY_STATUSES = ['new', 'contacted', 'qualified', 'rejected', 'hold', 'converted'];
const ENQUIRY_SOURCES = ['walkIn', 'phone', 'broker', 'metaAds', 'website', 'reference', 'other'];
const TEMPERATURES = ['hot', 'warm', 'cold'];

const remarkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const qualificationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['pending', 'qualified', 'rejected', 'hold'], default: 'pending' },
    budgetFit: { type: Boolean, default: true },
    timeline: { type: String, trim: true, default: '' },
    preferredVisitDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    qualifiedAt: { type: Date, default: null },
    qualifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectReason: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const enquirySchema = new mongoose.Schema(
  {
    enquiryNumber: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true, index: true },
    alternatePhone: { type: String, trim: true, default: '' },
    clientEmail: { type: String, trim: true, lowercase: true, default: '' },
    city: { type: String, trim: true, default: '' },

    source: { type: String, enum: ENQUIRY_SOURCES, default: 'phone', index: true },
    referenceName: { type: String, trim: true, default: '' },
    brokerName: { type: String, trim: true, default: '' },
    brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    propertyType: { type: String, trim: true, default: 'Luxury Villas' },
    project: { type: String, trim: true, default: '' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },

    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },

    temperature: { type: String, enum: TEMPERATURES, default: 'warm', index: true },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new', index: true },

    nextFollowupAt: { type: Date, default: null, index: true },
    followupTime: { type: String, trim: true, default: '' },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    remarks: { type: String, trim: true, default: '' },
    remarksHistory: { type: [remarkSchema], default: [] },
    lastCommentAt: { type: Date, default: Date.now, index: true },

    qualification: { type: qualificationSchema, default: () => ({}) },

    specialFollowUp: { type: Boolean, default: false, index: true },
    isWalkIn: { type: Boolean, default: false, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
module.exports.ENQUIRY_STATUSES = ENQUIRY_STATUSES;
module.exports.ENQUIRY_SOURCES = ENQUIRY_SOURCES;
module.exports.TEMPERATURES = TEMPERATURES;
