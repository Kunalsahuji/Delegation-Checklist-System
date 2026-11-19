const LandPurchase = require('../models/landPurchase.model');
const Plot = require('../models/plot.model');
const LegalCase = require('../models/legalCase.model');
const Feasibility = require('../models/feasibility.model');
const PmsProject = require('../models/pmsProject.model');
const {
  LAND_PURCHASE_SECTION_KEYS,
  LAND_PURCHASE_STATUS,
} = require('../constants/pms.constants');

const SECTION_LABEL = {
  negotiation: 'Negotiation',
  priceApproval: 'Price Approval',
  tokenPayment: 'Token Payment',
  saleAgreement: 'Sale Agreement',
  registry: 'Registry',
  mutation: 'Mutation',
};

class LandPurchaseService {
  /**
   * Derive status naming first incomplete section
   */
  advanceStatus(doc, userId) {
    if (['completed', 'cancelled'].includes(doc.status)) return;
    const next = LAND_PURCHASE_SECTION_KEYS.find((k) => doc[k]?.status !== 'completed');
    const to = next || 'mutation';
    if (doc.status !== to) {
      doc.statusHistory.push({
        from: doc.status,
        to,
        by: userId,
        reason: next ? `Now at ${SECTION_LABEL[next]}` : 'Ready for final completion',
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

    const purchases = await LandPurchase.find(filter).lean();

    const total = purchases.length;
    const inNegotiation = purchases.filter((p) => p.status === 'negotiation').length;
    const priceApprovalPending = purchases.filter((p) => p.status === 'priceApproval').length;
    const inExecution = purchases.filter((p) =>
      ['tokenPayment', 'saleAgreement', 'registry', 'mutation'].includes(p.status)
    ).length;
    const completed = purchases.filter((p) => p.status === 'completed').length;
    const cancelled = purchases.filter((p) => p.status === 'cancelled').length;

    const totalOutlay = purchases.reduce((acc, p) => acc + (Number(p.totalCost) || 0), 0);

    return {
      total,
      inNegotiation,
      priceApprovalPending,
      inExecution,
      completed,
      cancelled,
      totalOutlay,
    };
  }

  /**
   * Filterable paginated list of purchases
   */
  async listPurchases(query = {}) {
    const {
      page = 1,
      limit = 15,
      search = '',
      status,
      projectId,
      plotId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = { deletedAt: null };
    if (projectId) filter.project = projectId;
    if (plotId) filter.plot = plotId;
    if (status && status !== 'all') filter.status = status;

    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ code: rx }, { 'ownerSnapshot.name': rx }, { notes: rx }];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const [data, total] = await Promise.all([
      LandPurchase.find(filter)
        .populate('project', 'name code locality status')
        .populate('plot', 'code title surveyNumber area expectedCost status')
        .populate('legalCase', 'code status approval')
        .populate('feasibility', 'code verdict projections')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      LandPurchase.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  /**
   * Get single land purchase by ID
   */
  async getPurchaseById(id) {
    const purchase = await LandPurchase.findOne({ _id: id, deletedAt: null })
      .populate('project', 'name code locality stages plannedBudget')
      .populate('plot')
      .populate('legalCase')
      .populate('feasibility')
      .populate('priceApproval.decidedBy', 'name email avatar')
      .populate('priceApproval.requestedBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!purchase) {
      const err = new Error('Land purchase record not found');
      err.status = 404;
      throw err;
    }

    return purchase;
  }

  /**
   * Module 02 -> Module 03 Handoff: Open purchase for legally cleared plot
   */
  async createFromPlot({ plotId }, userId) {
    const plot = await Plot.findOne({ _id: plotId, deletedAt: null });
    if (!plot) {
      const err = new Error('Plot not found');
      err.status = 404;
      throw err;
    }

    // Check if active purchase already exists
    const existing = await LandPurchase.findOne({ plot: plotId, deletedAt: null });
    if (existing) {
      const populated = await this.getPurchaseById(existing._id);
      return { landPurchase: populated, created: false };
    }

    const legalCase = await LegalCase.findOne({ plot: plotId, status: 'approved', deletedAt: null }).lean();
    const feasibility = await Feasibility.findOne({ plot: plotId, status: 'approved', deletedAt: null }).lean();

    const count = await LandPurchase.countDocuments();
    const code = `PUR-${String(count + 1).padStart(6, '0')}`;
    const now = new Date();

    const purchase = new LandPurchase({
      code,
      project: plot.project,
      plot: plot._id,
      legalCase: legalCase?._id || null,
      feasibility: feasibility?._id || null,
      ownerSnapshot: {
        name: plot.owner?.name || 'Landowner',
        contact: plot.owner?.mobile || '',
      },
      estimatedLandCost: feasibility?.costs?.landCost || plot.expectedTotalPrice || 0,
      status: 'negotiation',
      statusHistory: [
        {
          to: 'negotiation',
          by: userId,
          reason: `Land purchase opened for legally cleared plot ${plot.code}`,
          at: now,
        },
      ],
      createdBy: userId,
    });

    await purchase.save();
    await this.syncStage3(plot.project);

    const populated = await this.getPurchaseById(purchase._id);
    return { landPurchase: populated, created: true };
  }

  /**
   * Section Blockers helper
   */
  sectionBlockers(doc, key) {
    const s = doc[key] || {};
    const blockers = [];

    switch (key) {
      case 'negotiation':
        if (!(Number(s.finalPrice) > 0)) blockers.push('Record the agreed price');
        if (!s.agreedOn) blockers.push('Record the date terms were agreed');
        break;
      case 'priceApproval':
        if (s.decision !== 'approved') blockers.push('The price must be formally approved');
        break;
      case 'tokenPayment':
        if (!(Number(s.amount) > 0)) blockers.push('Record the token payment amount');
        if (!s.paidOn) blockers.push('Record payment date');
        if (!s.mode) blockers.push('Record payment mode');
        if (s.mode && s.mode !== 'cash' && !String(s.reference || '').trim()) {
          blockers.push('Record payment reference (UTR or Cheque number)');
        }
        break;
      case 'saleAgreement':
        if (!String(s.agreementNo || '').trim()) blockers.push('Record the sale agreement number');
        if (!s.agreementDate) blockers.push('Record agreement date');
        if (!(Number(s.agreementValue) > 0)) blockers.push('Record agreement value');
        break;
      case 'registry':
        if (!String(s.registryNo || '').trim()) blockers.push('Record registry deed number');
        if (!s.registryDate) blockers.push('Record registry date');
        if (!String(s.registrarOffice || '').trim()) blockers.push('Record registrar office');
        break;
      case 'mutation':
        if (!String(s.mutationNo || '').trim()) blockers.push('Record mutation order number');
        if (!s.completedOn) blockers.push('Record mutation completion date');
        break;
      default:
        break;
    }

    return blockers;
  }

  /**
   * Update fields/data of a section
   */
  async updateSection(id, sectionKey, patch, userId) {
    if (!LAND_PURCHASE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown purchase section key');
      err.status = 400;
      throw err;
    }

    const doc = await LandPurchase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Land purchase record not found');
      err.status = 404;
      throw err;
    }

    if (['completed', 'cancelled'].includes(doc.status)) {
      const err = new Error(`Purchase is ${doc.status} and cannot be edited`);
      err.status = 400;
      throw err;
    }

    const section = doc[sectionKey];

    // Append negotiation round if provided
    if (sectionKey === 'negotiation' && patch.round) {
      section.rounds.push({
        offeredPrice: patch.round.offeredPrice != null ? Number(patch.round.offeredPrice) : null,
        counterPrice: patch.round.counterPrice != null ? Number(patch.round.counterPrice) : null,
        note: patch.round.note || '',
        by: userId,
        at: new Date(),
      });
    }

    // Handle witnesses for registry
    if (sectionKey === 'registry' && Array.isArray(patch.witnesses)) {
      section.witnesses = patch.witnesses.map((w) => ({
        name: w.name,
        contact: w.contact || '',
      }));
    }

    // Scalar merges
    Object.keys(patch).forEach((k) => {
      if (k !== 'round' && k !== 'witnesses' && section[k] !== undefined) {
        section[k] = patch[k];
      }
    });

    if (section.status === 'pending') {
      section.status = 'inProgress';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage3(doc.project);

    return this.getPurchaseById(id);
  }

  /**
   * Mark a section as completed
   */
  async completeSection(id, sectionKey, userId) {
    if (!LAND_PURCHASE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown purchase section key');
      err.status = 400;
      throw err;
    }

    const doc = await LandPurchase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Land purchase record not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];
    if (section.status === 'completed') {
      return this.getPurchaseById(id);
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
    await this.syncStage3(doc.project);

    return this.getPurchaseById(id);
  }

  /**
   * Request formal price approval from management
   */
  async requestApproval(id, { requestedPrice, note = '' }, userId) {
    const doc = await LandPurchase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Land purchase record not found');
      err.status = 404;
      throw err;
    }

    const price = Number(requestedPrice) || Number(doc.negotiation?.finalPrice) || 0;
    if (price <= 0) {
      const err = new Error('A valid purchase price must be specified');
      err.status = 422;
      throw err;
    }

    doc.priceApproval.requestedPrice = price;
    doc.priceApproval.requestedBy = userId;
    doc.priceApproval.requestedAt = new Date();
    doc.priceApproval.status = 'inProgress';

    doc.statusHistory.push({
      from: doc.status,
      to: 'priceApproval',
      by: userId,
      reason: note || `Requested price approval for ₹${price.toLocaleString('en-IN')}`,
      at: new Date(),
    });
    doc.status = 'priceApproval';
    doc.updatedBy = userId;

    await doc.save();
    return this.getPurchaseById(id);
  }

  /**
   * Decision Gate for Price Approval
   */
  async decidePrice(id, { decision, approvedPrice, note = '' }, userId) {
    const doc = await LandPurchase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Land purchase record not found');
      err.status = 404;
      throw err;
    }

    const now = new Date();
    const price =
      decision === 'approved'
        ? Number(approvedPrice) || Number(doc.priceApproval.requestedPrice) || 0
        : 0;

    doc.priceApproval.decision = decision;
    doc.priceApproval.decidedBy = userId;
    doc.priceApproval.decidedAt = now;
    doc.priceApproval.history.push({
      decision,
      price,
      note,
      by: userId,
      at: now,
    });

    if (decision === 'approved') {
      doc.priceApproval.approvedPrice = price;
      doc.priceApproval.status = 'completed';
      doc.priceApproval.completedBy = userId;
      doc.priceApproval.completedAt = now;
      this.advanceStatus(doc, userId);
    } else {
      // Return to negotiation for renegotiation
      doc.priceApproval.status = 'inProgress';
      doc.priceApproval.approvedPrice = 0;
      doc.negotiation.status = 'inProgress';
      doc.negotiation.completedBy = null;
      doc.negotiation.completedAt = null;

      doc.statusHistory.push({
        from: doc.status,
        to: 'negotiation',
        by: userId,
        reason: note || 'Price rejected; returned for renegotiation',
        at: now,
      });
      doc.status = 'negotiation';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage3(doc.project);

    return this.getPurchaseById(id);
  }

  /**
   * Complete entire Land Purchase & Registry (Stage 3 -> Stage 4 handoff)
   */
  async completePurchase(id, { note = '' } = {}, userId) {
    const doc = await LandPurchase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Land purchase not found');
      err.status = 404;
      throw err;
    }

    if (doc.status === 'completed') return this.getPurchaseById(id);

    // Verify all 6 sections are completed
    const incomplete = LAND_PURCHASE_SECTION_KEYS.filter(
      (k) => doc[k]?.status !== 'completed'
    );
    if (incomplete.length) {
      const err = new Error(`Cannot complete purchase; outstanding sections: ${incomplete.join(', ')}`);
      err.status = 422;
      throw err;
    }

    const now = new Date();
    doc.statusHistory.push({
      from: doc.status,
      to: 'completed',
      by: userId,
      reason: note || 'Land Purchase & Registry fully completed',
      at: now,
    });
    doc.status = 'completed';
    doc.completedAt = now;
    doc.completedBy = userId;
    doc.updatedBy = userId;

    await doc.save();
    await this.syncStage3(doc.project);

    // Advance project to Stage 4 (Project Planning & Approvals)
    await this.advanceToStage4(doc.project, userId);

    return this.getPurchaseById(id);
  }

  /**
   * Sync Stage 3 checklist on PmsProject
   */
  async syncStage3(projectId) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage3 = project.stages.find((s) => s.order === 3);
    if (!stage3) return;

    const purchases = await LandPurchase.find({ project: projectId, deletedAt: null }).lean();
    if (!purchases.length) return;

    // Stage 3 checklist: ['Agreement', 'Payment Schedule', 'Registry', 'Mutation']
    const hasAgreement = purchases.some((p) => p.saleAgreement?.status === 'completed');
    const hasPayment = purchases.some((p) => p.tokenPayment?.status === 'completed');
    const hasRegistry = purchases.some((p) => p.registry?.status === 'completed');
    const hasMutation = purchases.some((p) => p.mutation?.status === 'completed');
    const isAnyCompleted = purchases.some((p) => p.status === 'completed');

    if (stage3.checklist[0]) {
      stage3.checklist[0].done = hasAgreement;
      stage3.checklist[0].auto = true;
    }
    if (stage3.checklist[1]) {
      stage3.checklist[1].done = hasPayment;
      stage3.checklist[1].auto = true;
    }
    if (stage3.checklist[2]) {
      stage3.checklist[2].done = hasRegistry;
      stage3.checklist[2].auto = true;
    }
    if (stage3.checklist[3]) {
      stage3.checklist[3].done = hasMutation;
      stage3.checklist[3].auto = true;
    }

    if (isAnyCompleted && stage3.checklist.every((c) => c.done)) {
      stage3.approved = true;
      stage3.approvedAt = new Date();
    }

    await project.save();
  }

  /**
   * Advance project to Stage 4 (Project Planning & Approvals)
   */
  async advanceToStage4(projectId, userId) {
    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    if (project.stageOrder === 3) {
      project.stageOrder = 4;
      await project.save();
    }
  }
}

module.exports = new LandPurchaseService();
