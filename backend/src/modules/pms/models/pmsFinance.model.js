const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  FINANCE_STATUS,
  PAYMENT_STATUS,
  RA_BILL_STATUS,
  PAYMENT_MODES,
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

// 1. Budget vs Actual
const budgetVsActualSchema = new mongoose.Schema(
  {
    budgetedRevenue: { type: Number, min: 0, default: 0 },
    actualRevenueCollected: { type: Number, min: 0, default: 0 },
    budgetedExpenditure: { type: Number, min: 0, default: 0 },
    actualExpenditure: { type: Number, min: 0, default: 0 },
    grossMarginPercent: { type: Number, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Vendor Payments Schema
const vendorInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, trim: true, required: true, maxlength: 60 },
  poNumber: { type: String, trim: true, default: '', maxlength: 60 },
  vendorName: { type: String, trim: true, required: true, maxlength: 160 },
  invoiceDate: { type: Date, default: Date.now },
  grossAmount: { type: Number, min: 0, default: 0 },
  gstAmount: { type: Number, min: 0, default: 0 },
  tdsAmount: { type: Number, min: 0, default: 0 },
  retentionAmount: { type: Number, min: 0, default: 0 },
  netPayable: { type: Number, min: 0, default: 0 },
  paymentDate: { type: Date, default: null },
  paymentMode: { type: String, enum: PAYMENT_MODES, default: 'bankTransfer' },
  paymentRef: { type: String, trim: true, default: '', maxlength: 100 },
  status: { type: String, enum: PAYMENT_STATUS, default: 'Pending' },
});

const vendorPaymentsSchema = new mongoose.Schema(
  {
    invoices: { type: [vendorInvoiceSchema], default: [] },
    totalVendorInvoiced: { type: Number, min: 0, default: 0 },
    totalVendorPaid: { type: Number, min: 0, default: 0 },
    pendingVendorClearance: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Contractor RA Billing Schema
const contractorRaBillSchema = new mongoose.Schema({
  billNumber: { type: String, trim: true, required: true, maxlength: 60 },
  contractorName: { type: String, trim: true, required: true, maxlength: 160 },
  trade: { type: String, trim: true, default: 'Civil & Masonry', maxlength: 100 },
  workOrderRef: { type: String, trim: true, default: '', maxlength: 60 },
  billPeriod: { type: String, trim: true, default: '', maxlength: 100 },
  certifiedWorkValue: { type: Number, min: 0, default: 0 },
  previousBilled: { type: Number, min: 0, default: 0 },
  currentBilled: { type: Number, min: 0, default: 0 },
  retentionDeduction: { type: Number, min: 0, default: 0 },
  advanceRecovery: { type: Number, min: 0, default: 0 },
  netCertifiedPayable: { type: Number, min: 0, default: 0 },
  paidAmount: { type: Number, min: 0, default: 0 },
  paymentStatus: { type: String, enum: RA_BILL_STATUS, default: 'Draft' },
  engineerCertifier: { type: String, trim: true, default: 'Er. Sandeep Rathore', maxlength: 120 },
});

const contractorPaymentsSchema = new mongoose.Schema(
  {
    raBills: { type: [contractorRaBillSchema], default: [] },
    totalRaCertified: { type: Number, min: 0, default: 0 },
    totalRaPaid: { type: Number, min: 0, default: 0 },
    pendingRaClearance: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Cost and Profit Schema
const costAndProfitSchema = new mongoose.Schema(
  {
    landCost: { type: Number, min: 0, default: 0 },
    developmentCost: { type: Number, min: 0, default: 0 },
    approvalsCost: { type: Number, min: 0, default: 0 },
    procurementCost: { type: Number, min: 0, default: 0 },
    labourCost: { type: Number, min: 0, default: 0 },
    overheadsAndMisc: { type: Number, min: 0, default: 0 },
    totalCostOfProject: { type: Number, min: 0, default: 0 },
    projectedRevenue: { type: Number, min: 0, default: 0 },
    netProjectProfit: { type: Number, default: 0 },
    profitMarginPercent: { type: Number, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

const pmsFinanceSchema = new mongoose.Schema(
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
      enum: FINANCE_STATUS,
      default: 'activeAccounting',
      index: true,
    },
    budgetVsActual: { type: budgetVsActualSchema, default: () => ({}) },
    vendorPayments: { type: vendorPaymentsSchema, default: () => ({}) },
    contractorPayments: { type: contractorPaymentsSchema, default: () => ({}) },
    costAndProfit: { type: costAndProfitSchema, default: () => ({}) },
    totalDisbursements: { type: Number, min: 0, default: 0 },
    pendingDisbursements: { type: Number, min: 0, default: 0 },
    totalRaCertifiedAmount: { type: Number, min: 0, default: 0 },
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

pmsFinanceSchema.index({ project: 1, status: 1 });

const PmsFinance = mongoose.model('PmsFinance', pmsFinanceSchema);

module.exports = PmsFinance;
