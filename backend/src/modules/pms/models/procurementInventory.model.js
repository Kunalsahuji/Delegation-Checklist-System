const mongoose = require('mongoose');
require('../../auth/models/user.model');
require('./pmsProject.model');
const {
  PROCUREMENT_STATUS,
  MATERIAL_CATEGORIES,
  DEFAULT_VENDORS,
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

// 1. Vendor Selection
const vendorItemSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 200 },
  category: { type: String, enum: MATERIAL_CATEGORIES, default: 'general' },
  contactPerson: { type: String, trim: true, default: '', maxlength: 160 },
  phone: { type: String, trim: true, default: '', maxlength: 40 },
  email: { type: String, trim: true, default: '', maxlength: 120 },
  gstNumber: { type: String, trim: true, default: '', maxlength: 40 },
  panNumber: { type: String, trim: true, default: '', maxlength: 40 },
  rating: { type: Number, min: 1, max: 5, default: 4.5 },
  address: { type: String, trim: true, default: '', maxlength: 400 },
  isApproved: { type: Boolean, default: true },
});

const vendorSelectionSchema = new mongoose.Schema(
  {
    vendors: {
      type: [vendorItemSchema],
      default: () => DEFAULT_VENDORS.map((v) => ({ ...v, isApproved: true })),
    },
    ...sectionBase,
  },
  { _id: false }
);

// 2. Purchase Order
const poLineItemSchema = new mongoose.Schema({
  materialName: { type: String, trim: true, required: true, maxlength: 200 },
  category: { type: String, enum: MATERIAL_CATEGORIES, default: 'general' },
  unit: { type: String, trim: true, required: true, maxlength: 40 },
  quantity: { type: Number, min: 0, default: 0 },
  rate: { type: Number, min: 0, default: 0 },
  totalAmount: { type: Number, min: 0, default: 0 },
  remarks: { type: String, trim: true, default: '', maxlength: 400 },
});

const purchaseOrderItemSchema = new mongoose.Schema({
  poNumber: { type: String, trim: true, required: true, maxlength: 80 },
  vendorName: { type: String, trim: true, required: true, maxlength: 200 },
  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date, default: null },
  deliveryLocation: { type: String, trim: true, default: 'Central Project Site Godown', maxlength: 200 },
  items: { type: [poLineItemSchema], default: [] },
  totalAmount: { type: Number, min: 0, default: 0 },
  paymentTerms: { type: String, trim: true, default: '30 Days Net from GRN certification', maxlength: 500 },
  status: { type: String, enum: ['issued', 'partiallyReceived', 'completed', 'cancelled'], default: 'issued' },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    orders: { type: [purchaseOrderItemSchema], default: [] },
    totalPoValue: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 3. Material Receive (GRN)
const grnLineItemSchema = new mongoose.Schema({
  materialName: { type: String, trim: true, required: true, maxlength: 200 },
  unit: { type: String, trim: true, required: true, maxlength: 40 },
  orderedQty: { type: Number, min: 0, default: 0 },
  receivedQty: { type: Number, min: 0, default: 0 },
  acceptedQty: { type: Number, min: 0, default: 0 },
  rejectedQty: { type: Number, min: 0, default: 0 },
  remarks: { type: String, trim: true, default: '', maxlength: 400 },
});

const grnItemSchema = new mongoose.Schema({
  grnNumber: { type: String, trim: true, required: true, maxlength: 80 },
  poNumber: { type: String, trim: true, required: true, maxlength: 80 },
  vendorName: { type: String, trim: true, required: true, maxlength: 200 },
  receiveDate: { type: Date, default: Date.now },
  vehicleNumber: { type: String, trim: true, default: '', maxlength: 60 },
  challanNumber: { type: String, trim: true, default: '', maxlength: 80 },
  invoiceNumber: { type: String, trim: true, default: '', maxlength: 80 },
  receivedByName: { type: String, trim: true, default: 'Store In-Charge', maxlength: 160 },
  items: { type: [grnLineItemSchema], default: [] },
  qaStatus: { type: String, enum: ['accepted', 'rejected', 'partiallyAccepted'], default: 'accepted' },
  remarks: { type: String, trim: true, default: '', maxlength: 1000 },
});

const materialReceiveSchema = new mongoose.Schema(
  {
    grnList: { type: [grnItemSchema], default: [] },
    totalGrnCount: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// 4. Stock Entry (FIFO)
const stockLedgerItemSchema = new mongoose.Schema({
  materialName: { type: String, trim: true, required: true, maxlength: 200 },
  category: { type: String, enum: MATERIAL_CATEGORIES, default: 'general' },
  unit: { type: String, trim: true, required: true, maxlength: 40 },
  totalInwardQty: { type: Number, min: 0, default: 0 },
  totalIssuedQty: { type: Number, min: 0, default: 0 },
  currentStockQty: { type: Number, min: 0, default: 0 },
  minStockLevel: { type: Number, min: 0, default: 10 },
  unitRate: { type: Number, min: 0, default: 0 },
  stockValue: { type: Number, min: 0, default: 0 },
  storageLocation: { type: String, trim: true, default: 'Main Cement & Steel Yard', maxlength: 160 },
  status: { type: String, enum: ['inStock', 'lowStock', 'outOfStock'], default: 'inStock' },
});

const stockEntrySchema = new mongoose.Schema(
  {
    valuationMethod: { type: String, default: 'FIFO' },
    items: { type: [stockLedgerItemSchema], default: [] },
    totalStockValue: { type: Number, min: 0, default: 0 },
    ...sectionBase,
  },
  { _id: false }
);

// Management Approval Gate
const approvalEntrySchema = new mongoose.Schema({
  decision: { type: String, enum: ['approved', 'rejected'], required: true },
  note: { type: String, trim: true, default: '', maxlength: 2000 },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  at: { type: Date, default: Date.now },
});

const managementApprovalSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: null },
    decision: { type: String, enum: ['', 'approved', 'rejected'], default: '' },
    note: { type: String, trim: true, default: '', maxlength: 2000 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    history: { type: [approvalEntrySchema], default: [] },
  },
  { _id: false }
);

const procurementInventorySchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // PRC-000001
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PmsProject', required: true },

    status: { type: String, enum: PROCUREMENT_STATUS, default: 'vendorSelection', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    vendorSelection: { type: vendorSelectionSchema, default: () => ({}) },
    purchaseOrder: { type: purchaseOrderSchema, default: () => ({}) },
    materialReceive: { type: materialReceiveSchema, default: () => ({}) },
    stockEntry: { type: stockEntrySchema, default: () => ({}) },
    managementApproval: { type: managementApprovalSchema, default: () => ({}) },

    notes: { type: String, trim: true, default: '', maxlength: 4000 },
    approvedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

procurementInventorySchema.pre('save', function deriveProcurementTotals(next) {
  // 1. PO totals
  if (this.purchaseOrder && Array.isArray(this.purchaseOrder.orders)) {
    this.purchaseOrder.orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.totalAmount = o.items.reduce(
          (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
          0
        );
      }
    });
    this.purchaseOrder.totalPoValue = this.purchaseOrder.orders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
  }

  // 2. Material Receive GRN counts
  if (this.materialReceive && Array.isArray(this.materialReceive.grnList)) {
    this.materialReceive.totalGrnCount = this.materialReceive.grnList.length;
  }

  // 3. Stock Entry
  if (this.stockEntry && Array.isArray(this.stockEntry.items)) {
    this.stockEntry.items.forEach((s) => {
      s.currentStockQty = Math.max(0, (Number(s.totalInwardQty) || 0) - (Number(s.totalIssuedQty) || 0));
      s.stockValue = Math.round(s.currentStockQty * (Number(s.unitRate) || 0) * 100) / 100;
      if (s.currentStockQty <= 0) {
        s.status = 'outOfStock';
      } else if (s.currentStockQty <= (Number(s.minStockLevel) || 10)) {
        s.status = 'lowStock';
      } else {
        s.status = 'inStock';
      }
    });
    this.stockEntry.totalStockValue = this.stockEntry.items.reduce(
      (sum, s) => sum + (Number(s.stockValue) || 0),
      0
    );
  }

  next();
});

procurementInventorySchema.index(
  { project: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('ProcurementInventory', procurementInventorySchema);
