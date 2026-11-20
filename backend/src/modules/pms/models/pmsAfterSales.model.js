const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  AFTER_SALES_STATUS,
  CLAIM_STATUSES,
  CLAIM_SEVERITIES,
  WARRANTY_TRADES,
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

// 1. Warranty Claims Schema
const warrantyClaimItemSchema = new mongoose.Schema({
  claimNumber: { type: String, trim: true, required: true, maxlength: 60 },
  customerName: { type: String, trim: true, required: true, maxlength: 160 },
  unitNumber: { type: String, trim: true, default: '', maxlength: 60 },
  issueDescription: { type: String, trim: true, required: true, maxlength: 1000 },
  trade: { type: String, trim: true, default: 'Plumbing', maxlength: 100 },
  severity: { type: String, enum: CLAIM_SEVERITIES, default: 'Medium' },
  status: { type: String, enum: CLAIM_STATUSES, default: 'Reported' },
  reportedDate: { type: Date, default: Date.now },
  resolvedDate: { type: Date, default: null },
  assignedTechnician: { type: String, trim: true, default: 'DLP Rapid Response Team', maxlength: 120 },
  resolutionCost: { type: Number, min: 0, default: 0 },
});

const warrantyClaimsSchema = new mongoose.Schema(
  {
    claims: { type: [warrantyClaimItemSchema], default: [] },
    totalClaims: { type: Number, min: 0, default: 0 },
    activeClaims: { type: Number, min: 0, default: 0 },
    resolvedClaims: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 2. AMC Visits Schema
const amcVisitItemSchema = new mongoose.Schema({
  visitCode: { type: String, trim: true, required: true, maxlength: 60 },
  visitType: { type: String, trim: true, required: true, maxlength: 160 },
  scheduledDate: { type: Date, default: Date.now },
  completedDate: { type: Date, default: null },
  vendorName: { type: String, trim: true, default: 'Otis / BlueStar / Aquaguard Service', maxlength: 160 },
  technicianName: { type: String, trim: true, default: 'Certified Service Engineer', maxlength: 120 },
  findings: { type: String, trim: true, default: 'Routine diagnostic OK', maxlength: 1000 },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Rescheduled'], default: 'Scheduled' },
});

const amcVisitsSchema = new mongoose.Schema(
  {
    visits: { type: [amcVisitItemSchema], default: [] },
    totalVisits: { type: Number, min: 0, default: 0 },
    completedVisits: { type: Number, min: 0, default: 0 },
    pendingVisits: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Customer Support Tickets Schema
const customerSupportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, trim: true, required: true, maxlength: 60 },
  customerName: { type: String, trim: true, required: true, maxlength: 160 },
  contactNumber: { type: String, trim: true, default: '', maxlength: 40 },
  category: { type: String, trim: true, default: 'Facility Maintenance', maxlength: 100 },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'InProgress', 'Resolved', 'Closed'], default: 'Open' },
  subject: { type: String, trim: true, required: true, maxlength: 250 },
  resolutionNotes: { type: String, trim: true, default: '', maxlength: 1000 },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
});

const customerSupportSchema = new mongoose.Schema(
  {
    tickets: { type: [customerSupportTicketSchema], default: [] },
    totalTickets: { type: Number, min: 0, default: 0 },
    openTickets: { type: Number, min: 0, default: 0 },
    resolvedTickets: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Customer Feedback Schema
const customerReviewItemSchema = new mongoose.Schema({
  reviewId: { type: String, trim: true, required: true, maxlength: 60 },
  customerName: { type: String, trim: true, required: true, maxlength: 160 },
  unitNumber: { type: String, trim: true, default: '', maxlength: 60 },
  overallRating: { type: Number, min: 1, max: 5, default: 5 },
  qualityRating: { type: Number, min: 1, max: 5, default: 5 },
  serviceSpeedRating: { type: Number, min: 1, max: 5, default: 5 },
  comments: { type: String, trim: true, default: '', maxlength: 1000 },
  npsScore: { type: Number, min: 0, max: 10, default: 9 },
  submittedAt: { type: Date, default: Date.now },
});

const feedbackSchema = new mongoose.Schema(
  {
    reviews: { type: [customerReviewItemSchema], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalFeedbackCount: { type: Number, min: 0, default: 0 },
    npsScore: { type: Number, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

const pmsAfterSalesSchema = new mongoose.Schema(
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
      enum: AFTER_SALES_STATUS,
      default: 'warrantyActive',
      index: true,
    },
    warrantyClaims: { type: warrantyClaimsSchema, default: () => ({}) },
    amcVisits: { type: amcVisitsSchema, default: () => ({}) },
    customerSupport: { type: customerSupportSchema, default: () => ({}) },
    feedback: { type: feedbackSchema, default: () => ({}) },

    // Top-level fast aggregate indices
    totalClaimsCount: { type: Number, min: 0, default: 0, index: true },
    activeClaimsCount: { type: Number, min: 0, default: 0, index: true },
    completedVisitsCount: { type: Number, min: 0, default: 0, index: true },
    resolvedTicketsCount: { type: Number, min: 0, default: 0, index: true },
    averageSatisfactionScore: { type: Number, min: 0, max: 5, default: 0, index: true },

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

pmsAfterSalesSchema.index({ project: 1, status: 1 });

const PmsAfterSales = mongoose.model('PmsAfterSales', pmsAfterSalesSchema);

module.exports = PmsAfterSales;
