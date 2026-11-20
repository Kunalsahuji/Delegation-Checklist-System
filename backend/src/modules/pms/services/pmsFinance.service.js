const mongoose = require('mongoose');
const PmsFinance = require('../models/pmsFinance.model');
const PmsProject = require('../models/pmsProject.model');
const BaselinePlanning = require('../models/baselinePlanning.model');
const PreSiteStart = require('../models/preSiteStart.model');
const ProcurementInventory = require('../models/procurementInventory.model');
const {
  FINANCE_SECTION_KEYS,
  FINANCE_STATUS,
} = require('../constants/pms.constants');

class PmsFinanceService {
  async getKPIs() {
    const [agg] = await PmsFinance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalDisbursements: { $sum: '$totalDisbursements' },
          pendingDisbursements: { $sum: '$pendingDisbursements' },
          totalRaCertified: { $sum: '$totalRaCertifiedAmount' },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          activeAccounting: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['activeAccounting', 'billingInProgress', 'paymentReview'],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      total: agg?.total || 0,
      totalDisbursements: agg?.totalDisbursements || 0,
      pendingDisbursements: agg?.pendingDisbursements || 0,
      totalRaCertified: agg?.totalRaCertified || 0,
      approved: agg?.approved || 0,
      activeAccounting: agg?.activeAccounting || 0,
    };
  }

  async listRecords(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      projectId,
      hasOutflow,
      pendingClearance,
      hasRaBills,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      if (status === 'activeAccounting') {
        filter.status = {
          $in: ['activeAccounting', 'billingInProgress', 'paymentReview'],
        };
      } else {
        filter.status = status;
      }
    }

    if (hasOutflow === true || hasOutflow === 'true') {
      filter.totalDisbursements = { $gt: 0 };
    }

    if (pendingClearance === true || pendingClearance === 'true') {
      filter.pendingDisbursements = { $gt: 0 };
    }

    if (hasRaBills === true || hasRaBills === 'true') {
      filter.totalRaCertifiedAmount = { $gt: 0 };
    }

    if (projectId) {
      filter.project = projectId;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const projectMatches = await PmsProject.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { code: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');

      const projectIds = projectMatches.map((p) => p._id);
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { project: { $in: projectIds } },
      ];
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (numericPage - 1) * numericLimit;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [records, total] = await Promise.all([
      PmsFinance.find(filter)
        .populate('project', 'name code location status stageOrder baselineLocked')
        .populate('approvedBy', 'name email role')
        .populate('createdBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      PmsFinance.countDocuments(filter),
    ]);

    return {
      records,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit) || 1,
      },
    };
  }

  async getRecordById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid Finance Record ID');
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsFinance.findById(id)
      .populate('project', 'name code location status stageOrder baselineLocked')
      .populate('approvedBy', 'name email role')
      .populate('createdBy', 'name email')
      .populate('budgetVsActual.completedBy', 'name email')
      .populate('vendorPayments.completedBy', 'name email')
      .populate('contractorPayments.completedBy', 'name email')
      .populate('costAndProfit.completedBy', 'name email')
      .populate('statusHistory.by', 'name email');

    if (!record) {
      const err = new Error('Finance Record not found');
      err.statusCode = 404;
      throw err;
    }

    return record;
  }

  async createFromProject(projectId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const err = new Error('Invalid Project ID');
      err.statusCode = 400;
      throw err;
    }

    const project = await PmsProject.findById(projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Check existing
    let record = await PmsFinance.findOne({ project: projectId });
    if (record) {
      return { pmsFinance: await this.getRecordById(record._id), created: false };
    }

    const count = await PmsFinance.countDocuments();
    const code = `FIN-${String(count + 1).padStart(6, '0')}`;

    // Default Vendor Invoices
    const defaultInvoices = [
      {
        invoiceNumber: `INV-VND-001`,
        poNumber: `PO-${project.code || 'PRJ'}-001`,
        vendorName: 'Ultratech Cement Distributors Ltd',
        invoiceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        grossAmount: 760000,
        gstAmount: 136800,
        tdsAmount: 15200,
        retentionAmount: 0,
        netPayable: 881600,
        paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paymentMode: 'bankTransfer',
        paymentRef: 'NEFT/HDFC/904123847',
        status: 'Paid',
      },
      {
        invoiceNumber: `INV-VND-002`,
        poNumber: `PO-${project.code || 'PRJ'}-002`,
        vendorName: 'Kamdhenu & Tata Steel Agencies',
        invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        grossAmount: 1860000,
        gstAmount: 334800,
        tdsAmount: 37200,
        retentionAmount: 0,
        netPayable: 2157600,
        paymentDate: null,
        paymentMode: 'bankTransfer',
        paymentRef: '',
        status: 'Verified',
      },
    ];

    const totalVendorInvoiced = defaultInvoices.reduce((sum, i) => sum + i.netPayable, 0);
    const totalVendorPaid = defaultInvoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + i.netPayable, 0);
    const pendingVendorClearance = totalVendorInvoiced - totalVendorPaid;

    // Default Contractor RA Bills
    const defaultRaBills = [
      {
        billNumber: `RA-01`,
        contractorName: 'Apex Civil Infra & RCC Contractors',
        trade: 'Civil, RCC & Footings',
        workOrderRef: `WO-${project.code || 'PRJ'}-001`,
        billPeriod: 'Foundation PCC to Column Stems',
        certifiedWorkValue: 1250000,
        previousBilled: 0,
        currentBilled: 1250000,
        retentionDeduction: 62500, // 5% retention
        advanceRecovery: 100000,
        netCertifiedPayable: 1087500,
        paidAmount: 1087500,
        paymentStatus: 'Settled',
        engineerCertifier: 'Er. Sandeep Rathore',
      },
      {
        billNumber: `RA-02`,
        contractorName: 'Apex Civil Infra & RCC Contractors',
        trade: 'Plinth Beam & First Floor Columns',
        workOrderRef: `WO-${project.code || 'PRJ'}-001`,
        billPeriod: 'Plinth to 1st Floor Slab Casting',
        certifiedWorkValue: 1450000,
        previousBilled: 1250000,
        currentBilled: 1450000,
        retentionDeduction: 72500,
        advanceRecovery: 50000,
        netCertifiedPayable: 1327500,
        paidAmount: 0,
        paymentStatus: 'PaymentApproved',
        engineerCertifier: 'Er. Sandeep Rathore',
      },
    ];

    const totalRaCertified = defaultRaBills.reduce((sum, b) => sum + b.netCertifiedPayable, 0);
    const totalRaPaid = defaultRaBills
      .filter((b) => b.paymentStatus === 'Settled')
      .reduce((sum, b) => sum + b.paidAmount, 0);
    const pendingRaClearance = totalRaCertified - totalRaPaid;

    // Budget vs Actual
    const budgetedRevenue = 15000000;
    const actualRevenueCollected = 7200000;
    const budgetedExpenditure = 8500000;
    const actualExpenditure = totalVendorPaid + totalRaPaid;
    const grossMarginPercent = Number(
      (((budgetedRevenue - budgetedExpenditure) / budgetedRevenue) * 100).toFixed(1)
    );

    // Cost & Profit Breakdown
    const landCost = 2500000;
    const developmentCost = 1800000;
    const approvalsCost = 450000;
    const procurementCost = totalVendorInvoiced;
    const labourCost = totalRaCertified;
    const overheadsAndMisc = 350000;
    const totalCostOfProject =
      landCost + developmentCost + approvalsCost + procurementCost + labourCost + overheadsAndMisc;
    const netProjectProfit = budgetedRevenue - totalCostOfProject;
    const profitMarginPercent = Number(((netProjectProfit / budgetedRevenue) * 100).toFixed(1));

    const totalDisbursements = totalVendorPaid + totalRaPaid;
    const pendingDisbursements = pendingVendorClearance + pendingRaClearance;

    record = new PmsFinance({
      code,
      project: projectId,
      status: 'activeAccounting',
      budgetVsActual: {
        budgetedRevenue,
        actualRevenueCollected,
        budgetedExpenditure,
        actualExpenditure,
        grossMarginPercent,
      },
      vendorPayments: {
        invoices: defaultInvoices,
        totalVendorInvoiced,
        totalVendorPaid,
        pendingVendorClearance,
      },
      contractorPayments: {
        raBills: defaultRaBills,
        totalRaCertified,
        totalRaPaid,
        pendingRaClearance,
      },
      costAndProfit: {
        landCost,
        developmentCost,
        approvalsCost,
        procurementCost,
        labourCost,
        overheadsAndMisc,
        totalCostOfProject,
        projectedRevenue: budgetedRevenue,
        netProjectProfit,
        profitMarginPercent,
      },
      totalDisbursements,
      pendingDisbursements,
      totalRaCertifiedAmount: totalRaCertified,
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'activeAccounting',
          by: userId,
          reason: 'Stage 11 Finance Management & RA Billing ledger created',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage11(projectId);

    const populated = await this.getRecordById(record._id);
    return { pmsFinance: populated, created: true };
  }

  async updateSection(id, sectionKey, data, userId = null) {
    if (!FINANCE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsFinance.findById(id);
    if (!record) {
      const err = new Error('Finance record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Cannot modify approved finance record');
      err.statusCode = 400;
      throw err;
    }

    if (sectionKey === 'budgetVsActual') {
      if (data.budgetedRevenue !== undefined) record.budgetVsActual.budgetedRevenue = Number(data.budgetedRevenue);
      if (data.actualRevenueCollected !== undefined) record.budgetVsActual.actualRevenueCollected = Number(data.actualRevenueCollected);
      if (data.budgetedExpenditure !== undefined) record.budgetVsActual.budgetedExpenditure = Number(data.budgetedExpenditure);
      if (data.actualExpenditure !== undefined) record.budgetVsActual.actualExpenditure = Number(data.actualExpenditure);

      const rev = record.budgetVsActual.budgetedRevenue;
      const exp = record.budgetVsActual.budgetedExpenditure;
      record.budgetVsActual.grossMarginPercent = rev > 0 ? Number((((rev - exp) / rev) * 100).toFixed(1)) : 0;
      if (data.remarks !== undefined) record.budgetVsActual.remarks = data.remarks;
    } else if (sectionKey === 'vendorPayments') {
      if (data.invoices) {
        record.vendorPayments.invoices = data.invoices.map((inv) => {
          const gross = Number(inv.grossAmount || 0);
          const gst = Number(inv.gstAmount || 0);
          const tds = Number(inv.tdsAmount || 0);
          const ret = Number(inv.retentionAmount || 0);
          const net = gross + gst - tds - ret;
          return {
            ...inv,
            netPayable: net,
          };
        });

        const totalInvoiced = record.vendorPayments.invoices.reduce((sum, i) => sum + i.netPayable, 0);
        const totalPaid = record.vendorPayments.invoices
          .filter((i) => i.status === 'Paid')
          .reduce((sum, i) => sum + i.netPayable, 0);

        record.vendorPayments.totalVendorInvoiced = totalInvoiced;
        record.vendorPayments.totalVendorPaid = totalPaid;
        record.vendorPayments.pendingVendorClearance = totalInvoiced - totalPaid;
      }
      if (data.remarks !== undefined) record.vendorPayments.remarks = data.remarks;
    } else if (sectionKey === 'contractorPayments') {
      if (data.raBills) {
        record.contractorPayments.raBills = data.raBills.map((b) => {
          const curr = Number(b.currentBilled || 0);
          const ret = Number(b.retentionDeduction || 0);
          const adv = Number(b.advanceRecovery || 0);
          const net = curr - ret - adv;
          return {
            ...b,
            netCertifiedPayable: net,
          };
        });

        const totalCertified = record.contractorPayments.raBills.reduce((sum, b) => sum + b.netCertifiedPayable, 0);
        const totalPaid = record.contractorPayments.raBills
          .filter((b) => b.paymentStatus === 'Settled')
          .reduce((sum, b) => sum + (b.paidAmount || b.netCertifiedPayable), 0);

        record.contractorPayments.totalRaCertified = totalCertified;
        record.contractorPayments.totalRaPaid = totalPaid;
        record.contractorPayments.pendingRaClearance = totalCertified - totalPaid;
        record.totalRaCertifiedAmount = totalCertified;
      }
      if (data.remarks !== undefined) record.contractorPayments.remarks = data.remarks;
    } else if (sectionKey === 'costAndProfit') {
      if (data.landCost !== undefined) record.costAndProfit.landCost = Number(data.landCost);
      if (data.developmentCost !== undefined) record.costAndProfit.developmentCost = Number(data.developmentCost);
      if (data.approvalsCost !== undefined) record.costAndProfit.approvalsCost = Number(data.approvalsCost);
      if (data.procurementCost !== undefined) record.costAndProfit.procurementCost = Number(data.procurementCost);
      if (data.labourCost !== undefined) record.costAndProfit.labourCost = Number(data.labourCost);
      if (data.overheadsAndMisc !== undefined) record.costAndProfit.overheadsAndMisc = Number(data.overheadsAndMisc);
      if (data.projectedRevenue !== undefined) record.costAndProfit.projectedRevenue = Number(data.projectedRevenue);

      const totalCost =
        record.costAndProfit.landCost +
        record.costAndProfit.developmentCost +
        record.costAndProfit.approvalsCost +
        record.costAndProfit.procurementCost +
        record.costAndProfit.labourCost +
        record.costAndProfit.overheadsAndMisc;

      const projRev = record.costAndProfit.projectedRevenue;
      const netProfit = projRev - totalCost;
      const margin = projRev > 0 ? Number(((netProfit / projRev) * 100).toFixed(1)) : 0;

      record.costAndProfit.totalCostOfProject = totalCost;
      record.costAndProfit.netProjectProfit = netProfit;
      record.costAndProfit.profitMarginPercent = margin;
      if (data.remarks !== undefined) record.costAndProfit.remarks = data.remarks;
    }

    record.totalDisbursements =
      (record.vendorPayments?.totalVendorPaid || 0) + (record.contractorPayments?.totalRaPaid || 0);
    record.pendingDisbursements =
      (record.vendorPayments?.pendingVendorClearance || 0) +
      (record.contractorPayments?.pendingRaClearance || 0);

    record.budgetVsActual.status =
      record.budgetVsActual.budgetedRevenue > 0 ? 'completed' : 'inProgress';
    record.vendorPayments.status =
      record.vendorPayments.invoices.length > 0 ? 'completed' : 'inProgress';
    record.contractorPayments.status =
      record.contractorPayments.raBills.length > 0 ? 'completed' : 'inProgress';
    record.costAndProfit.status =
      record.costAndProfit.totalCostOfProject > 0 ? 'completed' : 'inProgress';

    await record.save();
    return this.getRecordById(record._id);
  }

  async completeSection(id, sectionKey, remarks = '', userId = null) {
    if (!FINANCE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error(`Invalid section key: ${sectionKey}`);
      err.statusCode = 400;
      throw err;
    }

    const record = await PmsFinance.findById(id);
    if (!record) {
      const err = new Error('Finance record not found');
      err.statusCode = 404;
      throw err;
    }

    record[sectionKey].status = 'completed';
    record[sectionKey].remarks = remarks || record[sectionKey].remarks;
    record[sectionKey].completedBy = userId;
    record[sectionKey].completedAt = new Date();

    const allSectionsDone = FINANCE_SECTION_KEYS.every(
      (k) => record[k].status === 'completed'
    );

    if (allSectionsDone && record.status === 'activeAccounting') {
      record.status = 'approvalPending';
      record.statusHistory.push({
        from: 'activeAccounting',
        to: 'approvalPending',
        by: userId,
        reason: 'All financial ledgers verified and reconciled. Submitted for Finance Approval.',
        at: new Date(),
      });
    }

    await record.save();
    return this.getRecordById(record._id);
  }

  async requestApproval(id, userId = null) {
    const record = await PmsFinance.findById(id);
    if (!record) {
      const err = new Error('Finance record not found');
      err.statusCode = 404;
      throw err;
    }

    if (record.status === 'approved') {
      const err = new Error('Finance record is already approved');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    record.status = 'approvalPending';
    record.statusHistory.push({
      from,
      to: 'approvalPending',
      by: userId,
      reason: 'Submitted for Stage 11 Finance Certification & Clearance',
      at: new Date(),
    });

    await record.save();
    return this.getRecordById(record._id);
  }

  async decideApproval(id, { decision, reason = '' }, userId = null) {
    const record = await PmsFinance.findById(id);
    if (!record) {
      const err = new Error('Finance record not found');
      err.statusCode = 404;
      throw err;
    }

    if (!['approved', 'rejected'].includes(decision)) {
      const err = new Error('Decision must be approved or rejected');
      err.statusCode = 400;
      throw err;
    }

    const from = record.status;
    if (decision === 'approved') {
      record.status = 'approved';
      record.isApproved = true;
      record.approvedBy = userId;
      record.approvedAt = new Date();
      record.rejectionReason = '';

      record.statusHistory.push({
        from,
        to: 'approved',
        by: userId,
        reason: reason || 'Stage 11 Finance & Cost certified and approved',
        at: new Date(),
      });

      await record.save();

      // Sync stage 11 to project
      await this.syncStage11(record.project, true);
    } else {
      record.status = 'rejected';
      record.isApproved = false;
      record.rejectionReason = reason;

      record.statusHistory.push({
        from,
        to: 'rejected',
        by: userId,
        reason: reason || 'Finance approval rejected / ledger reconciliation needed',
        at: new Date(),
      });

      await record.save();
    }

    return this.getRecordById(record._id);
  }

  async syncStage11(projectId, isApproved = false) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage11 = project.stages?.find((s) => s.order === 11 || s.key === 'finance');
    if (!stage11) return;

    const fin = await PmsFinance.findOne({ project: projectId }).lean();
    if (!fin) return;

    // Stage 11 checklist: ['Budget vs Actual', 'Vendor Payments', 'Contractor Payments', 'Cost & Profit']
    const hasBva = (fin.budgetVsActual?.budgetedRevenue || 0) > 0;
    const hasVendors = (fin.vendorPayments?.invoices?.length || 0) > 0;
    const hasContractors = (fin.contractorPayments?.raBills?.length || 0) > 0;
    const hasPnl = (fin.costAndProfit?.totalCostOfProject || 0) > 0;
    const isOfficiallyApproved = isApproved || fin.status === 'approved' || fin.isApproved;

    if (stage11.checklist?.[0]) {
      stage11.checklist[0].done = hasBva;
      stage11.checklist[0].auto = true;
    }
    if (stage11.checklist?.[1]) {
      stage11.checklist[1].done = hasVendors;
      stage11.checklist[1].auto = true;
    }
    if (stage11.checklist?.[2]) {
      stage11.checklist[2].done = hasContractors;
      stage11.checklist[2].auto = true;
    }
    if (stage11.checklist?.[3]) {
      stage11.checklist[3].done = hasPnl;
      stage11.checklist[3].auto = true;
    }

    if (isOfficiallyApproved) {
      stage11.approved = true;
      stage11.approvedAt = new Date();
      // Advance project to Stage 12: handover
      project.stageOrder = Math.max(project.stageOrder || 11, 12);
    }

    await project.save();
  }
}

module.exports = new PmsFinanceService();
