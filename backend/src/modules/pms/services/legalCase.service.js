const LegalCase = require('../models/legalCase.model');
const Plot = require('../models/plot.model');
const Feasibility = require('../models/feasibility.model');
const PmsProject = require('../models/pmsProject.model');
const User = require('../../auth/models/user.model');
const {
  LEGAL_SECTION_KEYS,
  TITLE_VERIFICATION_ITEMS,
  ENCUMBRANCE_ITEMS,
  LEGAL_DOCUMENT_ITEMS,
} = require('../constants/pms.constants');
const rules = require('../utils/legalRules');

const SECTION_ORDER = LEGAL_SECTION_KEYS; // ['titleVerification', 'encumbranceCheck', 'documentVerification', 'legalOpinion']

const seedItems = (tpl) => tpl.map((i) => ({ key: i.key, label: i.label, status: 'pending', remarks: '' }));
const seedDocumentItems = (tpl) =>
  tpl.map((i) => ({
    key: i.key,
    label: i.label,
    answer: '',
    remarks: '',
  }));

class LegalCaseService {
  /**
   * Derive status based on completed sections
   */
  derivedStatus(doc) {
    const next = SECTION_ORDER.find((k) => doc[k]?.status !== 'completed');
    return next || 'approvalPending';
  }

  /**
   * KPI metrics for Legal Verification
   */
  async getKPIs(projectId = null) {
    const filter = { deletedAt: null };
    if (projectId) filter.project = projectId;

    const cases = await LegalCase.find(filter).lean();

    const total = cases.length;
    const inProgress = cases.filter((c) =>
      ['titleVerification', 'encumbranceCheck', 'documentVerification', 'legalOpinion'].includes(c.status)
    ).length;
    const approvalPending = cases.filter((c) => c.status === 'approvalPending').length;
    const approved = cases.filter((c) => c.status === 'approved').length;
    const rejected = cases.filter((c) => c.status === 'rejected').length;
    const highRisk = cases.filter((c) => c.risk?.level === 'high').length;

    return {
      total,
      inProgress,
      approvalPending,
      approved,
      rejected,
      highRisk,
    };
  }

  /**
   * Filterable paginated list of legal cases
   */
  async listLegalCases(query = {}) {
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
      filter.$or = [{ code: rx }, { 'lawyer.name': rx }, { notes: rx }];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const [data, total] = await Promise.all([
      LegalCase.find(filter)
        .populate('project', 'name code locality status')
        .populate('plot', 'code title surveyNumber area expectedCost status')
        .populate('feasibility', 'code verdict status projections')
        .populate('lawyer.user', 'name email phone avatar')
        .populate('approval.decidedBy', 'name email')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      LegalCase.countDocuments(filter),
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
   * Get single legal case by ID with full references
   */
  async getLegalCaseById(id) {
    const legalCase = await LegalCase.findOne({ _id: id, deletedAt: null })
      .populate('project', 'name code locality stages plannedBudget')
      .populate('plot')
      .populate('feasibility')
      .populate('lawyer.user', 'name email phone avatar')
      .populate('approval.decidedBy', 'name email avatar')
      .populate('createdBy', 'name email')
      .lean();

    if (!legalCase) {
      const err = new Error('Legal case not found');
      err.status = 404;
      throw err;
    }

    return legalCase;
  }

  /**
   * Module 01 -> Module 02 interlink: Create or return active legal case from finalized plot
   */
  async createFromPlot({ plotId }, userId) {
    const plot = await Plot.findOne({ _id: plotId, deletedAt: null });
    if (!plot) {
      const err = new Error('Plot not found');
      err.status = 404;
      throw err;
    }

    if (plot.status !== 'approved') {
      const err = new Error('Only an approved plot can enter Legal Verification');
      err.status = 400;
      throw err;
    }

    // Check if active legal case already exists
    const existing = await LegalCase.findOne({ plot: plotId, deletedAt: null });
    if (existing) {
      const populated = await this.getLegalCaseById(existing._id);
      return { legalCase: populated, created: false };
    }

    const feasibility = await Feasibility.findOne({ plot: plotId, status: 'approved', deletedAt: null }).lean();
    const count = await LegalCase.countDocuments();
    const code = `LEG-${String(count + 1).padStart(6, '0')}`;
    const now = new Date();

    const newCase = new LegalCase({
      code,
      project: plot.project,
      plot: plot._id,
      feasibility: feasibility?._id || null,
      titleVerification: { status: 'pending', items: seedItems(TITLE_VERIFICATION_ITEMS) },
      encumbranceCheck: { status: 'pending', items: seedItems(ENCUMBRANCE_ITEMS) },
      documentVerification: { status: 'pending', items: seedDocumentItems(LEGAL_DOCUMENT_ITEMS) },
      legalOpinion: { status: 'pending' },
      status: 'titleVerification',
      statusHistory: [
        {
          to: 'titleVerification',
          by: userId,
          reason: `Legal case created from approved plot ${plot.code}`,
          at: now,
        },
      ],
      createdBy: userId,
    });

    newCase.risk = rules.computeRisk(newCase);
    await newCase.save();

    await this.syncStage2(plot.project);

    const populated = await this.getLegalCaseById(newCase._id);
    return { legalCase: populated, created: true };
  }

  /**
   * Assign lawyer and update notes
   */
  async updateLegalCase(id, data, userId) {
    const doc = await LegalCase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Legal case not found');
      err.status = 404;
      throw err;
    }

    if (['approved', 'rejected'].includes(doc.status)) {
      const err = new Error('A decided legal case can no longer be edited');
      err.status = 400;
      throw err;
    }

    if (data.lawyerUserId) {
      const picked = await User.findOne({ _id: data.lawyerUserId, status: 'active' }).lean();
      if (!picked) {
        const err = new Error('Selected lawyer user not found');
        err.status = 404;
        throw err;
      }
      doc.lawyer = {
        user: picked._id,
        name: picked.name,
        mobile: picked.phone || '',
        firmName: data.firmName || doc.lawyer?.firmName || '',
      };
    } else if (data.lawyer) {
      doc.lawyer = {
        ...doc.lawyer?.toObject?.(),
        ...data.lawyer,
      };
    }

    if (data.notes !== undefined) doc.notes = data.notes;
    doc.updatedBy = userId;
    await doc.save();

    return this.getLegalCaseById(id);
  }

  /**
   * Update items/fields of a verification section
   */
  async updateSection(id, sectionKey, patch, userId) {
    if (!SECTION_ORDER.includes(sectionKey)) {
      const err = new Error('Unknown legal section key');
      err.status = 400;
      throw err;
    }

    const doc = await LegalCase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Legal case not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];

    // Merge items
    if (Array.isArray(patch.items)) {
      patch.items.forEach((u) => {
        const item = section.items?.find((i) => i.key === u.key);
        if (!item) return;

        if (sectionKey === 'documentVerification') {
          if (u.answer !== undefined) {
            item.answer = u.answer;
            if (u.answer === 'yes' && u.remarks === undefined) item.remarks = '';
          }
        } else if (u.status !== undefined) {
          item.status = u.status;
        }

        if (u.remarks !== undefined) item.remarks = u.remarks;
      });
    }

    // Scalar fields
    const scalars = [
      'remarks',
      'riskLevel',
      'advocateName',
      'advocateContact',
      'opinion',
      'recommendation',
      'riskCategory',
      'suggestedAction',
      'signature',
    ];
    scalars.forEach((f) => {
      if (patch[f] !== undefined) section[f] = patch[f];
    });

    if (sectionKey === 'legalOpinion') {
      section.recordedBy = userId;
      if (patch.signature) section.signedAt = new Date();
    }

    if (section.status === 'pending') {
      section.status = 'inProgress';
    }

    doc.risk = rules.computeRisk(doc);
    doc.updatedBy = userId;
    await doc.save();

    return this.getLegalCaseById(id);
  }

  /**
   * Mark a section as completed
   */
  async completeSection(id, sectionKey, userId, { override = false } = {}) {
    if (!SECTION_ORDER.includes(sectionKey)) {
      const err = new Error('Unknown legal section key');
      err.status = 400;
      throw err;
    }

    const doc = await LegalCase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Legal case not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];
    if (section.status === 'completed') {
      const err = new Error('Section is already completed');
      err.status = 400;
      throw err;
    }

    const blockers = rules.sectionBlockers(section, sectionKey, {
      encumbranceRisk: doc.encumbranceCheck?.riskLevel || '',
    });

    if (blockers.length && !override) {
      const err = new Error(`Section incomplete: ${blockers.join('; ')}`);
      err.status = 422;
      err.blockers = blockers;
      throw err;
    }

    section.status = 'completed';
    section.completedBy = userId;
    section.completedAt = new Date();

    doc.risk = rules.computeRisk(doc);
    const nextStatus = this.derivedStatus(doc);

    doc.statusHistory.push({
      from: doc.status,
      to: nextStatus,
      by: userId,
      reason: `${sectionKey} completed`,
      at: new Date(),
    });
    doc.status = nextStatus;
    doc.updatedBy = userId;

    await doc.save();
    await this.syncStage2(doc.project);

    return this.getLegalCaseById(id);
  }

  /**
   * PM Approval Gate decision
   */
  async decide(id, { decision, note = '' }, userId) {
    const doc = await LegalCase.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Legal case not found');
      err.status = 404;
      throw err;
    }

    if (!['approvalPending', 'onHold'].includes(doc.status)) {
      const err = new Error(`A ${doc.status} case cannot be decided`);
      err.status = 400;
      throw err;
    }

    if (['rejected', 'clarificationNeeded', 'onHold'].includes(decision) && !note.trim()) {
      const err = new Error('A note is required for this decision');
      err.status = 422;
      throw err;
    }

    if (decision === 'approved') {
      const readiness = rules.approvalReadiness(doc);
      if (!readiness.canDecide) {
        const err = new Error(`Approval blocked: ${readiness.blockers.join('; ')}`);
        err.status = 422;
        throw err;
      }
      if (readiness.requiresJustification && !note.trim()) {
        const err = new Error('A written justification is required to approve a high-risk case');
        err.status = 422;
        throw err;
      }
    }

    const now = new Date();
    doc.approval = {
      decision,
      note,
      decidedBy: userId,
      decidedAt: now,
      history: [...(doc.approval?.history || []), { decision, note, by: userId, at: now }],
    };

    if (decision === 'clarificationNeeded') {
      doc.legalOpinion.status = 'inProgress';
      doc.legalOpinion.completedBy = null;
      doc.legalOpinion.completedAt = null;
    }

    doc.status = decision;
    doc.statusHistory.push({
      from: doc.status,
      to: decision,
      by: userId,
      reason: note || `Decision: ${decision}`,
      at: now,
    });
    doc.updatedBy = userId;

    await doc.save();
    await this.syncStage2(doc.project);

    // If approved, advance project stage order from Stage 2 -> Stage 3
    if (decision === 'approved') {
      await this.advanceToStage3(doc.project, userId);
    }

    return this.getLegalCaseById(id);
  }

  /**
   * Sync Stage 2 checklist items on PmsProject
   */
  async syncStage2(projectId) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage2 = project.stages.find((s) => s.order === 2);
    if (!stage2) return;

    const cases = await LegalCase.find({ project: projectId, deletedAt: null }).lean();
    if (!cases.length) return;

    // Check progress of sections across cases
    const hasTitleDone = cases.some((c) => c.titleVerification?.status === 'completed');
    const hasEncDone = cases.some((c) => c.encumbranceCheck?.status === 'completed');
    const hasOpinionDone = cases.some((c) => c.legalOpinion?.status === 'completed');
    const hasDocDone = cases.some((c) => c.documentVerification?.status === 'completed');
    const isAnyApproved = cases.some((c) => c.status === 'approved');

    // Stage 2 labels: ['Title Verification', 'Encumbrance Check', 'Legal Opinion', 'Documents Verified']
    if (stage2.checklist[0]) {
      stage2.checklist[0].done = hasTitleDone;
      stage2.checklist[0].auto = true;
    }
    if (stage2.checklist[1]) {
      stage2.checklist[1].done = hasEncDone;
      stage2.checklist[1].auto = true;
    }
    if (stage2.checklist[2]) {
      stage2.checklist[2].done = hasOpinionDone;
      stage2.checklist[2].auto = true;
    }
    if (stage2.checklist[3]) {
      stage2.checklist[3].done = hasDocDone;
      stage2.checklist[3].auto = true;
    }

    if (isAnyApproved && stage2.checklist.every((c) => c.done)) {
      stage2.approved = true;
      stage2.approvedAt = new Date();
    }

    await project.save();
  }

  /**
   * Advance project to Stage 3 (Land Purchase & Registry) upon Stage 2 approval
   */
  async advanceToStage3(projectId, userId) {
    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    if (project.stageOrder === 2) {
      project.stageOrder = 3;
      await project.save();
    }
  }
}

module.exports = new LegalCaseService();
