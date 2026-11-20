const ProcurementInventory = require('../models/procurementInventory.model');
const PmsProject = require('../models/pmsProject.model');
const BaselinePlanning = require('../models/baselinePlanning.model');
const {
  PROCUREMENT_SECTION_KEYS,
  PROCUREMENT_STATUS,
  DEFAULT_VENDORS,
} = require('../constants/pms.constants');

const SECTION_LABEL = {
  vendorSelection: 'Vendor Selection',
  purchaseOrder: 'Purchase Order',
  materialReceive: 'Material Receive (GRN)',
  stockEntry: 'Stock Entry (FIFO)',
};

class ProcurementInventoryService {
  /**
   * Advance status to the next incomplete procurement section
   */
  advanceStatus(doc, userId) {
    if (['approved', 'cancelled'].includes(doc.status)) return;
    const next = PROCUREMENT_SECTION_KEYS.find((k) => doc[k]?.status !== 'completed');
    const to = next || 'managementApproval';
    if (doc.status !== to) {
      doc.statusHistory.push({
        from: doc.status,
        to,
        by: userId,
        reason: next ? `Now at ${SECTION_LABEL[next]}` : 'Ready for management sign-off',
        at: new Date(),
      });
      doc.status = to;
    }
  }

  /**
   * Overview KPIs
   */
  async getKPIs(projectId = null) {
    const filter = { deletedAt: null };
    if (projectId) filter.project = projectId;

    const records = await ProcurementInventory.find(filter).lean();

    const total = records.length;
    const inProcurement = records.filter((r) =>
      ['vendorSelection', 'purchaseOrder', 'materialReceive', 'stockEntry'].includes(r.status)
    ).length;
    const approvalPending = records.filter((r) => r.status === 'managementApproval').length;
    const approved = records.filter((r) => r.status === 'approved').length;

    const totalPoValue = records.reduce(
      (acc, r) => acc + (Number(r.purchaseOrder?.totalPoValue) || 0),
      0
    );

    const totalStockValue = records.reduce(
      (acc, r) => acc + (Number(r.stockEntry?.totalStockValue) || 0),
      0
    );

    const totalGrnCount = records.reduce(
      (acc, r) => acc + (Number(r.materialReceive?.totalGrnCount) || 0),
      0
    );

    return {
      total,
      inProcurement,
      approvalPending,
      approved,
      totalPoValue,
      totalStockValue,
      totalGrnCount,
    };
  }

  /**
   * Paginated List
   */
  async listRecords(params = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      projectId = '',
    } = params;

    const filter = { deletedAt: null };
    if (projectId) filter.project = projectId;

    if (status && status !== 'all') {
      if (status === 'inProcurement') {
        filter.status = {
          $in: ['vendorSelection', 'purchaseOrder', 'materialReceive', 'stockEntry'],
        };
      } else if (status === 'hasOrders') {
        filter['purchaseOrder.totalPoValue'] = { $gt: 0 };
      } else {
        filter.status = status;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { 'vendorSelection.vendors.name': { $regex: q, $options: 'i' } },
        { 'purchaseOrder.orders.poNumber': { $regex: q, $options: 'i' } },
        { 'materialReceive.grnList.grnNumber': { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ProcurementInventory.find(filter)
        .populate('project', 'name code currentStageName stageOrder locality city baselineLocked')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ProcurementInventory.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    };
  }

  /**
   * Single Record by ID
   */
  async getRecordById(id) {
    const record = await ProcurementInventory.findOne({ _id: id, deletedAt: null })
      .populate('project')
      .populate('managementApproval.decidedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!record) {
      const err = new Error('Procurement record not found');
      err.status = 404;
      throw err;
    }
    return record;
  }

  /**
   * Auto-generate code
   */
  async generateCode() {
    const count = await ProcurementInventory.countDocuments();
    return `PRC-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Create or fetch for project
   */
  async createFromProject(projectId, userId) {
    let record = await ProcurementInventory.findOne({ project: projectId, deletedAt: null });
    if (record) {
      return { procurementInventory: await this.getRecordById(record._id), created: false };
    }

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const code = await this.generateCode();

    // Initial purchase orders from standard requirements
    const defaultOrders = [
      {
        poNumber: `PO-${project.code || 'PRJ'}-001`,
        vendorName: 'Ultratech Cement Distributors Ltd',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Central Project Site Godown',
        items: [
          { materialName: 'OPC 53 Grade Cement', category: 'cement', unit: 'Bags', quantity: 2000, rate: 380, totalAmount: 760000, remarks: 'First foundation lot' },
        ],
        totalAmount: 760000,
        paymentTerms: '30 Days Net from GRN certification',
        status: 'issued',
      },
      {
        poNumber: `PO-${project.code || 'PRJ'}-002`,
        vendorName: 'Kamdhenu & Tata Steel Agencies',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Central Project Site Godown',
        items: [
          { materialName: 'Fe 550D TMT Reinforcement Steel', category: 'steel', unit: 'MT', quantity: 30, rate: 62000, totalAmount: 1860000, remarks: 'Footing & column rebar' },
        ],
        totalAmount: 1860000,
        paymentTerms: '15 Days Net post weighbridge verification',
        status: 'issued',
      },
    ];

    // Initial Stock Ledger
    const defaultStock = [
      { materialName: 'OPC 53 Grade Cement', category: 'cement', unit: 'Bags', totalInwardQty: 2000, totalIssuedQty: 250, currentStockQty: 1750, minStockLevel: 200, unitRate: 380, stockValue: 665000, storageLocation: 'Covered Cement Godown No. 1', status: 'inStock' },
      { materialName: 'Fe 550D TMT Steel', category: 'steel', unit: 'MT', totalInwardQty: 30, totalIssuedQty: 5, currentStockQty: 25, minStockLevel: 5, unitRate: 62000, stockValue: 1550000, storageLocation: 'Central Rebar Fabrication Yard', status: 'inStock' },
      { materialName: 'Coarse River Sand', category: 'sand', unit: 'MT', totalInwardQty: 150, totalIssuedQty: 30, currentStockQty: 120, minStockLevel: 25, unitRate: 1400, stockValue: 168000, storageLocation: 'Open Aggregate Staging Pit A', status: 'inStock' },
      { materialName: '20mm Blue Metal Basalt', category: 'aggregate', unit: 'MT', totalInwardQty: 200, totalIssuedQty: 40, currentStockQty: 160, minStockLevel: 30, unitRate: 950, stockValue: 152000, storageLocation: 'Open Aggregate Staging Pit B', status: 'inStock' },
    ];

    record = new ProcurementInventory({
      code,
      project: projectId,
      status: 'vendorSelection',
      vendorSelection: {
        vendors: DEFAULT_VENDORS.map((v) => ({ ...v, isApproved: true })),
      },
      purchaseOrder: {
        orders: defaultOrders,
        totalPoValue: 2620000,
      },
      stockEntry: {
        valuationMethod: 'FIFO',
        items: defaultStock,
        totalStockValue: 2535000,
      },
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'vendorSelection',
          by: userId,
          reason: 'Stage 7 Procurement & Inventory initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage7(projectId);

    const populated = await this.getRecordById(record._id);
    return { procurementInventory: populated, created: true };
  }

  /**
   * Section Blockers helper
   */
  sectionBlockers(doc, key) {
    const s = doc[key] || {};
    const blockers = [];

    switch (key) {
      case 'vendorSelection':
        if (!Array.isArray(s.vendors) || s.vendors.length === 0) {
          blockers.push('Enlist suppliers in vendor directory');
        } else {
          const approved = s.vendors.filter((v) => v.isApproved);
          if (approved.length === 0) blockers.push('Approve at least one vendor for procurement');
        }
        break;
      case 'purchaseOrder':
        if (!Array.isArray(s.orders) || s.orders.length === 0) {
          blockers.push('Issue at least one formal Purchase Order (PO)');
        } else if (!(Number(s.totalPoValue) > 0)) {
          blockers.push('Purchase order commitment amount must be greater than zero');
        }
        break;
      case 'materialReceive':
        if (!Array.isArray(s.grnList) || s.grnList.length === 0) {
          blockers.push('Record at least one certified Goods Received Note (GRN)');
        }
        break;
      case 'stockEntry':
        if (!Array.isArray(s.items) || s.items.length === 0) {
          blockers.push('Record inward materials in FIFO stock ledger');
        }
        break;
      default:
        break;
    }

    return blockers;
  }

  /**
   * Update Section Data
   */
  async updateSection(id, sectionKey, patch, userId) {
    if (!PROCUREMENT_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown procurement section key');
      err.status = 400;
      throw err;
    }

    const doc = await ProcurementInventory.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Procurement record not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];

    // Array fields
    if (sectionKey === 'vendorSelection' && Array.isArray(patch.vendors)) {
      section.vendors = patch.vendors;
    }
    if (sectionKey === 'purchaseOrder' && Array.isArray(patch.orders)) {
      section.orders = patch.orders;
    }
    if (sectionKey === 'materialReceive' && Array.isArray(patch.grnList)) {
      section.grnList = patch.grnList;
    }
    if (sectionKey === 'stockEntry' && Array.isArray(patch.items)) {
      section.items = patch.items;
    }

    // Scalar merges
    Object.keys(patch).forEach((k) => {
      if (k !== 'vendors' && k !== 'orders' && k !== 'grnList' && k !== 'items' && section[k] !== undefined) {
        section[k] = patch[k];
      }
    });

    if (section.status === 'pending') {
      section.status = 'inProgress';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage7(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Mark section completed
   */
  async completeSection(id, sectionKey, userId) {
    if (!PROCUREMENT_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown procurement section key');
      err.status = 400;
      throw err;
    }

    const doc = await ProcurementInventory.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Procurement record not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];
    if (section.status === 'completed') {
      return this.getRecordById(id);
    }

    const blockers = this.sectionBlockers(doc, sectionKey);
    if (blockers.length) {
      const err = new Error(`Section incomplete: ${blockers.join('; ')}`);
      err.status = 422;
      err.blockers = blockers;
      throw err;
    }

    section.status = 'completed';
    section.completedBy = userId;
    section.completedAt = new Date();

    this.advanceStatus(doc, userId);
    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage7(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Request Management Approval Gate
   */
  async requestApproval(id, payload = {}, userId) {
    const doc = await ProcurementInventory.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Procurement record not found');
      err.status = 404;
      throw err;
    }

    const allCompleted = PROCUREMENT_SECTION_KEYS.every((k) => doc[k]?.status === 'completed');
    if (!allCompleted) {
      const incomplete = PROCUREMENT_SECTION_KEYS.filter((k) => doc[k]?.status !== 'completed').map(
        (k) => SECTION_LABEL[k]
      );
      const err = new Error(`Cannot request approval: complete pending sections (${incomplete.join(', ')})`);
      err.status = 422;
      throw err;
    }

    doc.managementApproval.requestedBy = userId;
    doc.managementApproval.requestedAt = new Date();
    doc.managementApproval.decision = '';

    if (doc.status !== 'managementApproval') {
      doc.statusHistory.push({
        from: doc.status,
        to: 'managementApproval',
        by: userId,
        reason: payload.note || 'All 4 procurement and inventory sections completed; awaiting management sign-off',
        at: new Date(),
      });
      doc.status = 'managementApproval';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage7(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Approve or Reject Management Decision Gate
   */
  async decideApproval(id, payload, userId) {
    const { decision, note = '' } = payload;
    if (!['approved', 'rejected'].includes(decision)) {
      const err = new Error('Decision must be "approved" or "rejected"');
      err.status = 400;
      throw err;
    }

    const doc = await ProcurementInventory.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Procurement record not found');
      err.status = 404;
      throw err;
    }

    doc.managementApproval.decision = decision;
    doc.managementApproval.note = note;
    doc.managementApproval.decidedBy = userId;
    doc.managementApproval.decidedAt = new Date();
    doc.managementApproval.history.push({
      decision,
      note,
      by: userId,
      at: new Date(),
    });

    const prev = doc.status;
    if (decision === 'approved') {
      doc.status = 'approved';
      doc.approvedAt = new Date();
    } else {
      doc.status = 'stockEntry';
    }

    doc.statusHistory.push({
      from: prev,
      to: doc.status,
      by: userId,
      reason: `Management ${decision}: ${note || 'No notes provided'}`,
      at: new Date(),
    });

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage7(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Sync Stage 7 with PmsProject lifecycle rail
   */
  async syncStage7(projectId) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage7 = project.stages.find((s) => s.order === 7);
    if (!stage7) return;

    const prc = await ProcurementInventory.findOne({ project: projectId, deletedAt: null }).lean();
    if (!prc) return;

    // Stage 7 checklist: ['Vendor Selection', 'Purchase Order', 'Material Receive', 'Stock Entry (FIFO)']
    const hasVendors = prc.vendorSelection?.status === 'completed';
    const hasPO = prc.purchaseOrder?.status === 'completed';
    const hasGRN = prc.materialReceive?.status === 'completed';
    const hasStock = prc.stockEntry?.status === 'completed';
    const hasMgmtApproval = prc.managementApproval?.decision === 'approved';

    if (stage7.checklist[0]) {
      stage7.checklist[0].done = hasVendors;
      stage7.checklist[0].auto = true;
    }
    if (stage7.checklist[1]) {
      stage7.checklist[1].done = hasPO;
      stage7.checklist[1].auto = true;
    }
    if (stage7.checklist[2]) {
      stage7.checklist[2].done = hasGRN;
      stage7.checklist[2].auto = true;
    }
    if (stage7.checklist[3]) {
      stage7.checklist[3].done = hasStock;
      stage7.checklist[3].auto = true;
    }

    // If all 4 done and management approved, mark stage 7 approved and advance project to Stage 8 (Construction Execution)!
    if (hasVendors && hasPO && hasGRN && hasStock && hasMgmtApproval) {
      stage7.approved = true;
      stage7.approvedAt = new Date();

      if (project.stageOrder === 7) {
        project.stageOrder = 8; // Advance to Stage 8: Construction Execution (DPR)
      }
    }

    await project.save();
  }
}

module.exports = new ProcurementInventoryService();
