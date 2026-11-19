const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
require('./plot.model');
require('./legalCase.model');
const {
  LAND_PURCHASE_STATUS,
  LAND_PURCHASE_SECTION_STATUS,
  LAND_PURCHASE_DECISIONS,
  PAYMENT_MODES,
} = require('../constants/pms.constants');

const sectionBase = {
  status: { type: String, enum: LAND_PURCHASE_SECTION_STATUS, default: 'pending' },
  remarks: { type: String, trim: true, default: '', maxlength: 2000 },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date, default: null },
};

const negotiationRoundSchema = new mongoose.Schema(
  {
    offeredPrice: { type: Number, min: 0, default: null },
    counterPrice: { type: Number, min: 0, default: null },
    note: { type: String, trim: true, default: '', maxlength: 1000 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const negotiationSchema = new mongoose.Schema(
  {
    ...sectionBase,
    rounds: { type: [negotiationRoundSchema], default: [] },
    finalPrice: { type: Number, min: 0, default: 0 },
    agreedOn: { type: Date, default: null },
  },
  { _id: false }
);

const approvalEntrySchema = new mongoose.Schema(
  {
    decision: { type: String, enum: LAND_PURCHASE_DECISIONS, required: true },
    price: { type: Number, min: 0, default: 0 },
    note: { type: String, trim: true, default: '', maxlength: 2000 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const priceApprovalSchema = new mongoose.Schema(
  {
    ...sectionBase,
    requestedPrice: { type: Number, min: 0, default: 0 },
    approvedPrice: { type: Number, min: 0, default: 0 },
    decision: { type: String, enum: ['', ...LAND_PURCHASE_DECISIONS], default: '' },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: null },
    history: { type: [approvalEntrySchema], default: [] },
  },
  { _id: false }
);

const tokenPaymentSchema = new mongoose.Schema(
  {
    ...sectionBase,
    amount: { type: Number, min: 0, default: 0 },
    paidOn: { type: Date, default: null },
    mode: { type: String, enum: ['', ...PAYMENT_MODES], default: '' },
    reference: { type: String, trim: true, default: '', maxlength: 120 },
    bank: { type: String, trim: true, default: '', maxlength: 160 },
    paidBy: { type: String, trim: true, default: '', maxlength: 160 },
  },
  { _id: false }
);

const saleAgreementSchema = new mongoose.Schema(
  {
    ...sectionBase,
    agreementNo: { type: String, trim: true, default: '', maxlength: 80 },
    agreementDate: { type: Date, default: null },
    agreementValue: { type: Number, min: 0, default: 0 },
    validUntil: { type: Date, default: null },
    conditions: { type: String, trim: true, default: '', maxlength: 4000 },
    verifiedBy: { type: String, trim: true, default: '', maxlength: 160 },
    verifiedOn: { type: Date, default: null },
  },
  { _id: false }
);

const witnessSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 160 },
    contact: { type: String, trim: true, default: '', maxlength: 40 },
  },
  { _id: false }
);

const registrySchema = new mongoose.Schema(
  {
    ...sectionBase,
    registryNo: { type: String, trim: true, default: '', maxlength: 80 },
    registryDate: { type: Date, default: null },
    registrarOffice: { type: String, trim: true, default: '', maxlength: 200 },
    witnesses: { type: [witnessSchema], default: [] },
    stampDuty: { type: Number, min: 0, default: 0 },
    registrationFee: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const mutationSchema = new mongoose.Schema(
  {
    ...sectionBase,
    mutationNo: { type: String, trim: true, default: '', maxlength: 80 },
    authority: { type: String, trim: true, default: '', maxlength: 200 },
    appliedOn: { type: Date, default: null },
    completedOn: { type: Date, default: null },
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
  { _id: false }
);

const landPurchaseSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // PUR-000001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true, index: true },
    plot: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    legalCase: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalCase', default: null },

    ownerSnapshot: {
      name: { type: String, trim: true, default: '' },
      contact: { type: String, trim: true, default: '' },
    },

    status: { type: String, enum: LAND_PURCHASE_STATUS, default: 'negotiation', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    negotiation: { type: negotiationSchema, default: () => ({}) },
    priceApproval: { type: priceApprovalSchema, default: () => ({}) },
    tokenPayment: { type: tokenPaymentSchema, default: () => ({}) },
    saleAgreement: { type: saleAgreementSchema, default: () => ({}) },
    registry: { type: registrySchema, default: () => ({}) },
    mutation: { type: mutationSchema, default: () => ({}) },

    totalCost: { type: Number, min: 0, default: 0 },

    feasibility: { type: mongoose.Schema.Types.ObjectId, ref: 'Feasibility', default: null },
    estimatedLandCost: { type: Number, min: 0, default: 0 },

    notes: { type: String, trim: true, default: '', maxlength: 4000 },

    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason: { type: String, trim: true, default: '', maxlength: 1000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

landPurchaseSchema.pre('save', function deriveTotalCost(next) {
  const base =
    Number(this.saleAgreement?.agreementValue) ||
    Number(this.priceApproval?.approvedPrice) ||
    Number(this.negotiation?.finalPrice) ||
    0;
  const duty = Number(this.registry?.stampDuty) || 0;
  const fee = Number(this.registry?.registrationFee) || 0;
  this.totalCost = Math.round((base + duty + fee + Number.EPSILON) * 100) / 100;
  next();
});

landPurchaseSchema.index({ project: 1, status: 1 });
landPurchaseSchema.index(
  { plot: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('LandPurchase', landPurchaseSchema);
