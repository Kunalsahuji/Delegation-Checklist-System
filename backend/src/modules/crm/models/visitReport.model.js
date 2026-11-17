const mongoose = require('mongoose');

const VISIT_NUMBERS = ['1st', '2nd', '3rd', '4th+'];

const visitReportSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      default: null,
      index: true,
    },

    visitedAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    customerName: { type: String, trim: true, default: '' },
    contactNumber: { type: String, trim: true, default: '' },
    salesPersonName: { type: String, trim: true, default: '' },

    // Who actually performed the site visit
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visitorName: { type: String, trim: true, default: '' },

    // Project reference and name
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    projectVisited: { type: String, trim: true, default: '' },
    propertyInterested: { type: String, trim: true, default: '' },

    // Preferences captured after visit
    firstPreference: { type: String, trim: true, default: '' },
    secondPreference: { type: String, trim: true, default: '' },
    customerBudget: { type: String, trim: true, default: '' },
    customerProfession: { type: String, trim: true, default: '' },
    customerAddress: { type: String, trim: true, default: '' },
    sourceOfCustomer: { type: String, trim: true, default: '' },
    seniorPerson: { type: String, trim: true, default: '' },
    visitNumber: { type: String, enum: VISIT_NUMBERS, default: '1st', index: true },

    stageName: { type: String, trim: true, default: '' },
    stageOrder: { type: Number, default: null, index: true },

    remarks: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },

    // Geo-location verification
    submittedLat: { type: Number, default: null },
    submittedLng: { type: Number, default: null },
    submittedAccuracy: { type: Number, default: null },
    geoVerified: { type: Boolean, default: false, index: true },
    geoDistanceMeters: { type: Number, default: null },
    geoMatchedLocation: { type: String, trim: true, default: '' },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Soft delete support
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

visitReportSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('VisitReport', visitReportSchema);
module.exports.VISIT_NUMBERS = VISIT_NUMBERS;
