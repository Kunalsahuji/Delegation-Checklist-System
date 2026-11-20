const PreSiteStart = require('../models/preSiteStart.model');
const PmsProject = require('../models/pmsProject.model');
const ProjectPlanning = require('../models/projectPlanning.model');
const {
  PRE_SITE_SECTION_KEYS,
  PRE_SITE_STATUS,
} = require('../constants/pms.constants');

const SECTION_LABEL = {
  contractorSelection: 'Contractor Selection',
  rateFinalization: 'Rate Finalization',
  workOrder: 'Work Order / Agreement',
  siteSetup: 'Site Setup & Mobilization',
};

class PreSiteStartService {
  /**
   * Advance status to the next incomplete pre-site section
   */
  advanceStatus(doc, userId) {
    if (['approved', 'cancelled'].includes(doc.status)) return;
    const next = PRE_SITE_SECTION_KEYS.find((k) => doc[k]?.status !== 'completed');
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

    const records = await PreSiteStart.find(filter).lean();

    const total = records.length;
    const inPreSite = records.filter((r) =>
      ['contractorSelection', 'rateFinalization', 'workOrder', 'siteSetup'].includes(r.status)
    ).length;
    const approvalPending = records.filter((r) => r.status === 'managementApproval').length;
    const approved = records.filter((r) => r.status === 'approved').length;

    const totalContractValue = records.reduce(
      (acc, r) => acc + (Number(r.workOrder?.contractValue) || 0),
      0
    );

    const siteMobilizedCount = records.filter(
      (r) => r.siteSetup?.status === 'completed'
    ).length;

    return {
      total,
      inPreSite,
      approvalPending,
      approved,
      totalContractValue,
      siteMobilizedCount,
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
      if (status === 'inPreSite') {
        filter.status = {
          $in: ['contractorSelection', 'rateFinalization', 'workOrder', 'siteSetup'],
        };
      } else {
        filter.status = status;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { 'contractorSelection.contractorName': { $regex: q, $options: 'i' } },
        { 'contractorSelection.companyName': { $regex: q, $options: 'i' } },
        { 'workOrder.workOrderNumber': { $regex: q, $options: 'i' } },
        { 'siteSetup.siteEngineerName': { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PreSiteStart.find(filter)
        .populate('project', 'name code currentStageName stageOrder locality city')
        .populate('projectPlanning', 'code budget')
        .populate('siteSetup.siteEngineer', 'name email phone')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PreSiteStart.countDocuments(filter),
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
    const record = await PreSiteStart.findOne({ _id: id, deletedAt: null })
      .populate('project')
      .populate('projectPlanning')
      .populate('siteSetup.siteEngineer', 'name email phone')
      .populate('managementApproval.decidedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!record) {
      const err = new Error('Pre-site start record not found');
      err.status = 404;
      throw err;
    }
    return record;
  }

  /**
   * Auto-generate code
   */
  async generateCode() {
    const count = await PreSiteStart.countDocuments();
    return `PSS-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Create or fetch for project
   */
  async createFromProject(projectId, userId) {
    let record = await PreSiteStart.findOne({ project: projectId, deletedAt: null });
    if (record) {
      return { preSiteStart: await this.getRecordById(record._id), created: false };
    }

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const plan = await ProjectPlanning.findOne({ project: projectId, deletedAt: null });
    const code = await this.generateCode();

    const initialContractValue = plan?.budget?.totalEstimatedCost || 0;

    record = new PreSiteStart({
      code,
      project: projectId,
      projectPlanning: plan?._id || null,
      workOrder: {
        contractValue: initialContractValue,
        advanceAmount: Math.round(initialContractValue * 0.05), // 5% token mobilization advance default
        retentionPercent: 5,
        workOrderNumber: `WO-${project.code || 'PRJ'}-001`,
        issueDate: new Date(),
      },
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'contractorSelection',
          by: userId,
          reason: 'Initial pre-site start & contractor procurement initiated',
          at: new Date(),
        },
      ],
    });

    await record.save();
    await this.syncStage5(projectId);

    const populated = await this.getRecordById(record._id);
    return { preSiteStart: populated, created: true };
  }

  /**
   * Section Blockers helper
   */
  sectionBlockers(doc, key) {
    const s = doc[key] || {};
    const blockers = [];

    switch (key) {
      case 'contractorSelection':
        if (!String(s.contractorName || '').trim()) blockers.push('Specify selected contractor or agency name');
        if (!String(s.phone || s.contactPerson || '').trim()) blockers.push('Provide contractor primary contact details');
        break;
      case 'rateFinalization':
        if (!Array.isArray(s.items) || s.items.length === 0) {
          blockers.push('Define rate schedule items');
        } else {
          const hasZeroAgreed = s.items.some((i) => !(Number(i.agreedRate) > 0));
          if (hasZeroAgreed) blockers.push('All items in rate schedule must have agreed rate > 0');
        }
        break;
      case 'workOrder':
        if (!String(s.workOrderNumber || '').trim()) blockers.push('Specify official Work Order (WO) number');
        if (!(Number(s.contractValue) > 0)) blockers.push('Contract value must be greater than zero');
        break;
      case 'siteSetup':
        if (!String(s.siteEngineerName || '').trim() && !s.siteEngineer) {
          blockers.push('Designate dedicated site engineer');
        }
        if (!s.waterConnection?.ready && !s.powerConnection?.ready && !s.barricading?.ready) {
          blockers.push('Verify basic site mobilization facilities (water, electricity, or barricading)');
        }
        break;
      default:
        break;
    }

    return blockers;
  }

  /**
   * Update section patch
   */
  async updateSection(id, sectionKey, patch, userId) {
    if (!PRE_SITE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown pre-site section key');
      err.status = 400;
      throw err;
    }

    const doc = await PreSiteStart.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Pre-site start record not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];

    // Handle rate items array
    if (sectionKey === 'rateFinalization' && Array.isArray(patch.items)) {
      section.items = patch.items;
      // Auto-compute negotiated savings if tender rates exist
      const totalTender = patch.items.reduce((acc, i) => acc + (Number(i.tenderRate) || 0), 0);
      const totalAgreed = patch.items.reduce((acc, i) => acc + (Number(i.agreedRate) || 0), 0);
      section.negotiatedSavings = Math.max(0, totalTender - totalAgreed);
    }

    // Scalar merges
    Object.keys(patch).forEach((k) => {
      if (k !== 'items' && section[k] !== undefined) {
        section[k] = patch[k];
      }
    });

    if (section.status === 'pending') {
      section.status = 'inProgress';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage5(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Mark section completed
   */
  async completeSection(id, sectionKey, userId) {
    if (!PRE_SITE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown pre-site section key');
      err.status = 400;
      throw err;
    }

    const doc = await PreSiteStart.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Pre-site record not found');
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
    await this.syncStage5(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Request Management Approval Gate
   */
  async requestApproval(id, payload = {}, userId) {
    const doc = await PreSiteStart.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Pre-site record not found');
      err.status = 404;
      throw err;
    }

    const allCompleted = PRE_SITE_SECTION_KEYS.every((k) => doc[k]?.status === 'completed');
    if (!allCompleted) {
      const incomplete = PRE_SITE_SECTION_KEYS.filter((k) => doc[k]?.status !== 'completed').map(
        (k) => SECTION_LABEL[k]
      );
      const err = new Error(`Cannot request approval: complete pending sections (${incomplete.join(', ')})`);
      err.status = 422;
      throw err;
    }

    doc.managementApproval.requestedBy = userId;
    doc.managementApproval.requestedAt = new Date();
    doc.managementApproval.decision = '';
    doc.managementApproval.note = payload.note || '';

    if (doc.status !== 'managementApproval') {
      doc.statusHistory.push({
        from: doc.status,
        to: 'managementApproval',
        by: userId,
        reason: payload.note || 'All 4 pre-site setup sections complete; awaiting management sign-off',
        at: new Date(),
      });
      doc.status = 'managementApproval';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage5(doc.project);

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

    const doc = await PreSiteStart.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Pre-site record not found');
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
      doc.status = 'siteSetup';
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
    await this.syncStage5(doc.project);

    return this.getRecordById(doc._id);
  }

  /**
   * Sync Stage 5 with PmsProject lifecycle rail
   */
  async syncStage5(projectId) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage5 = project.stages.find((s) => s.order === 5);
    if (!stage5) return;

    const pss = await PreSiteStart.findOne({ project: projectId, deletedAt: null }).lean();
    if (!pss) return;

    // Stage 5 checklist: ['Contractor Selection', 'Rate Finalization', 'WO / Agreement', 'Site Setup']
    const hasContractor = pss.contractorSelection?.status === 'completed';
    const hasRates = pss.rateFinalization?.status === 'completed';
    const hasWO = pss.workOrder?.status === 'completed';
    const hasSiteSetup = pss.siteSetup?.status === 'completed';
    const hasMgmtApproval = pss.managementApproval?.decision === 'approved';

    if (stage5.checklist[0]) {
      stage5.checklist[0].done = hasContractor;
      stage5.checklist[0].auto = true;
    }
    if (stage5.checklist[1]) {
      stage5.checklist[1].done = hasRates;
      stage5.checklist[1].auto = true;
    }
    if (stage5.checklist[2]) {
      stage5.checklist[2].done = hasWO;
      stage5.checklist[2].auto = true;
    }
    if (stage5.checklist[3]) {
      stage5.checklist[3].done = hasSiteSetup;
      stage5.checklist[3].auto = true;
    }

    // If all 4 done and management approved, mark stage 5 approved and advance project to Stage 6 (Baseline Planning)
    if (hasContractor && hasRates && hasWO && hasSiteSetup && hasMgmtApproval) {
      stage5.approved = true;
      stage5.approvedAt = new Date();

      if (project.stageOrder === 5) {
        project.stageOrder = 6; // Advance to Stage 6: Baseline Planning
      }
    }

    await project.save();
  }
}

module.exports = new PreSiteStartService();
