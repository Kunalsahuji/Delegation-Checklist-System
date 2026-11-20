const BaselinePlanning = require('../models/baselinePlanning.model');
const PmsProject = require('../models/pmsProject.model');
const ProjectPlanning = require('../models/projectPlanning.model');
const {
  BASELINE_SECTION_KEYS,
  BASELINE_STATUS,
  DEFAULT_MATERIALS,
  DEFAULT_LABOUR_TRADES,
  DEFAULT_TIMELINE_MILESTONES,
} = require('../constants/pms.constants');

const SECTION_LABEL = {
  plannedMaterial: 'Planned Material',
  plannedLabour: 'Planned Labour',
  plannedTimeline: 'Planned Timeline',
  plannedCashflow: 'Planned Cashflow',
};

class BaselinePlanningService {
  /**
   * Advance status to the next incomplete baseline planning section
   */
  advanceStatus(doc, userId) {
    if (['locked', 'cancelled'].includes(doc.status)) return;
    const next = BASELINE_SECTION_KEYS.find((k) => doc[k]?.status !== 'completed');
    const to = next || 'baselineReview';
    if (doc.status !== to) {
      doc.statusHistory.push({
        from: doc.status,
        to,
        by: userId,
        reason: next ? `Now at ${SECTION_LABEL[next]}` : 'Ready for executive baseline freeze',
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

    const baselines = await BaselinePlanning.find(filter).lean();

    const total = baselines.length;
    const inPlanning = baselines.filter((b) =>
      ['plannedMaterial', 'plannedLabour', 'plannedTimeline', 'plannedCashflow'].includes(b.status)
    ).length;
    const awaitingLock = baselines.filter((b) => b.status === 'baselineReview').length;
    const lockedCount = baselines.filter((b) => b.baselineLock?.isLocked).length;

    const totalBaselineBudget = baselines.reduce(
      (acc, b) => acc + (Number(b.baselineLock?.totalBaselineBudget) || 0),
      0
    );

    const totalMaterialBudget = baselines.reduce(
      (acc, b) => acc + (Number(b.plannedMaterial?.totalMaterialCost) || 0),
      0
    );

    const totalLabourBudget = baselines.reduce(
      (acc, b) => acc + (Number(b.plannedLabour?.totalLabourCost) || 0),
      0
    );

    return {
      total,
      inPlanning,
      awaitingLock,
      lockedCount,
      totalBaselineBudget,
      totalMaterialBudget,
      totalLabourBudget,
    };
  }

  /**
   * Paginated List
   */
  async listBaselines(params = {}) {
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
      if (status === 'inPlanning') {
        filter.status = {
          $in: ['plannedMaterial', 'plannedLabour', 'plannedTimeline', 'plannedCashflow'],
        };
      } else if (status === 'locked') {
        filter['baselineLock.isLocked'] = true;
      } else {
        filter.status = status;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { 'plannedTimeline.milestones.name': { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      BaselinePlanning.find(filter)
        .populate('project', 'name code currentStageName stageOrder baselineLocked locality city')
        .populate('baselineLock.lockedBy', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      BaselinePlanning.countDocuments(filter),
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
   * Single Baseline Detail by ID
   */
  async getBaselineById(id) {
    const record = await BaselinePlanning.findOne({ _id: id, deletedAt: null })
      .populate('project')
      .populate('baselineLock.lockedBy', 'name email')
      .populate('baselineLock.requestedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!record) {
      const err = new Error('Baseline planning record not found');
      err.status = 404;
      throw err;
    }
    return record;
  }

  /**
   * Auto-generate code
   */
  async generateCode() {
    const count = await BaselinePlanning.countDocuments();
    return `BSL-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Create or fetch for project
   */
  async createFromProject(projectId, userId) {
    let baseline = await BaselinePlanning.findOne({ project: projectId, deletedAt: null });
    if (baseline) {
      return { baselinePlanning: await this.getBaselineById(baseline._id), created: false };
    }

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const code = await this.generateCode();

    // Default monthly cashflow breakdown (6 milestone tranches)
    const defaultCashflow = [
      { monthLabel: 'Month 1-2', targetMilestone: 'Excavation & Foundations', materialOutflow: 3500000, labourOutflow: 1200000, contractorOutflow: 1500000, miscOutflow: 300000 },
      { monthLabel: 'Month 3-5', targetMilestone: 'Substructure & Plinth RCC', materialOutflow: 6500000, labourOutflow: 2200000, contractorOutflow: 2800000, miscOutflow: 500000 },
      { monthLabel: 'Month 6-9', targetMilestone: 'Superstructure Framing', materialOutflow: 8500000, labourOutflow: 3400000, contractorOutflow: 3600000, miscOutflow: 500000 },
      { monthLabel: 'Month 10-12', targetMilestone: 'Masonry & Plastering', materialOutflow: 4200000, labourOutflow: 1800000, contractorOutflow: 2000000, miscOutflow: 400000 },
      { monthLabel: 'Month 13-15', targetMilestone: 'MEP, Utilities & Conduiting', materialOutflow: 3800000, labourOutflow: 1500000, contractorOutflow: 1800000, miscOutflow: 400000 },
      { monthLabel: 'Month 16-18', targetMilestone: 'Finishing & Handover', materialOutflow: 2500000, labourOutflow: 1100000, contractorOutflow: 1300000, miscOutflow: 400000 },
    ];

    baseline = new BaselinePlanning({
      code,
      project: projectId,
      status: 'plannedMaterial',
      plannedTimeline: {
        plannedStartDate: new Date(),
        plannedCompletionDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000), // 18 months
        totalDurationDays: 540,
        milestones: DEFAULT_TIMELINE_MILESTONES.map((t) => ({ ...t })),
      },
      plannedCashflow: {
        items: defaultCashflow,
      },
      createdBy: userId,
      statusHistory: [
        {
          from: '',
          to: 'plannedMaterial',
          by: userId,
          reason: 'Stage 6 Baseline Planning commenced',
          at: new Date(),
        },
      ],
    });

    await baseline.save();
    await this.syncStage6(projectId);

    const populated = await this.getBaselineById(baseline._id);
    return { baselinePlanning: populated, created: true };
  }

  /**
   * Section Blockers helper
   */
  sectionBlockers(doc, key) {
    const s = doc[key] || {};
    const blockers = [];

    switch (key) {
      case 'plannedMaterial':
        if (!Array.isArray(s.items) || s.items.length === 0) {
          blockers.push('Define material heads in bill of quantities');
        } else if (!(Number(s.totalMaterialCost) > 0)) {
          blockers.push('Material plan total cost must be greater than zero');
        }
        break;
      case 'plannedLabour':
        if (!Array.isArray(s.items) || s.items.length === 0) {
          blockers.push('Define labour gangs and headcounts');
        } else if (!(Number(s.totalLabourCost) > 0)) {
          blockers.push('Labour plan total cost must be greater than zero');
        }
        break;
      case 'plannedTimeline':
        if (!s.plannedStartDate) blockers.push('Specify planned project start date');
        if (!s.plannedCompletionDate) blockers.push('Specify planned project completion date');
        if (!Array.isArray(s.milestones) || s.milestones.length === 0) {
          blockers.push('Milestones timeline schedule must have at least 1 milestone');
        }
        break;
      case 'plannedCashflow':
        if (!Array.isArray(s.items) || s.items.length === 0) {
          blockers.push('Define month-on-month cash outflow projection schedule');
        } else if (!(Number(s.totalCashflowPlanned) > 0)) {
          blockers.push('Total projected cashflow must be greater than zero');
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
    if (!BASELINE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown baseline planning section key');
      err.status = 400;
      throw err;
    }

    const doc = await BaselinePlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Baseline record not found');
      err.status = 404;
      throw err;
    }

    if (doc.baselineLock?.isLocked) {
      const err = new Error('Baseline is frozen and locked; modifications require a formal Change Order');
      err.status = 403;
      throw err;
    }

    const section = doc[sectionKey];

    // Arrays replacement
    if (sectionKey === 'plannedMaterial' && Array.isArray(patch.items)) {
      section.items = patch.items;
    }
    if (sectionKey === 'plannedLabour' && Array.isArray(patch.items)) {
      section.items = patch.items;
    }
    if (sectionKey === 'plannedTimeline' && Array.isArray(patch.milestones)) {
      section.milestones = patch.milestones;
    }
    if (sectionKey === 'plannedCashflow' && Array.isArray(patch.items)) {
      section.items = patch.items;
    }

    // Scalar merges
    Object.keys(patch).forEach((k) => {
      if (k !== 'items' && k !== 'milestones' && section[k] !== undefined) {
        section[k] = patch[k];
      }
    });

    if (section.status === 'pending') {
      section.status = 'inProgress';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage6(doc.project);

    return this.getBaselineById(doc._id);
  }

  /**
   * Mark section completed
   */
  async completeSection(id, sectionKey, userId) {
    if (!BASELINE_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown baseline section key');
      err.status = 400;
      throw err;
    }

    const doc = await BaselinePlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Baseline record not found');
      err.status = 404;
      throw err;
    }

    if (doc.baselineLock?.isLocked) {
      const err = new Error('Baseline is frozen and locked');
      err.status = 403;
      throw err;
    }

    const section = doc[sectionKey];
    if (section.status === 'completed') {
      return this.getBaselineById(id);
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
    await this.syncStage6(doc.project);

    return this.getBaselineById(doc._id);
  }

  /**
   * Request Baseline Lock Review
   */
  async requestBaselineLock(id, payload = {}, userId) {
    const doc = await BaselinePlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Baseline record not found');
      err.status = 404;
      throw err;
    }

    const allCompleted = BASELINE_SECTION_KEYS.every((k) => doc[k]?.status === 'completed');
    if (!allCompleted) {
      const incomplete = BASELINE_SECTION_KEYS.filter((k) => doc[k]?.status !== 'completed').map(
        (k) => SECTION_LABEL[k]
      );
      const err = new Error(`Cannot request lock: complete pending sections (${incomplete.join(', ')})`);
      err.status = 422;
      throw err;
    }

    doc.baselineLock.requestedBy = userId;
    doc.baselineLock.requestedAt = new Date();
    doc.baselineLock.decision = '';

    if (doc.status !== 'baselineReview') {
      doc.statusHistory.push({
        from: doc.status,
        to: 'baselineReview',
        by: userId,
        reason: payload.note || 'All 4 baseline planning sections completed; awaiting management freeze sanction',
        at: new Date(),
      });
      doc.status = 'baselineReview';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage6(doc.project);

    return this.getBaselineById(doc._id);
  }

  /**
   * Lock Baseline (Governance Freeze!)
   */
  async lockBaseline(id, payload, userId) {
    const { decision, note = '' } = payload;
    if (!['approved', 'rejected'].includes(decision)) {
      const err = new Error('Decision must be "approved" or "rejected"');
      err.status = 400;
      throw err;
    }

    const doc = await BaselinePlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Baseline record not found');
      err.status = 404;
      throw err;
    }

    doc.baselineLock.decision = decision;
    doc.baselineLock.lockNotes = note;
    doc.baselineLock.history.push({
      decision,
      note,
      budgetAtLock: doc.baselineLock.totalBaselineBudget,
      by: userId,
      at: new Date(),
    });

    const prev = doc.status;
    if (decision === 'approved') {
      doc.baselineLock.isLocked = true;
      doc.baselineLock.lockedAt = new Date();
      doc.baselineLock.lockedBy = userId;
      doc.status = 'locked';
    } else {
      doc.status = 'plannedCashflow';
    }

    doc.statusHistory.push({
      from: prev,
      to: doc.status,
      by: userId,
      reason: `Management ${decision === 'approved' ? 'Baseline Lock Approved' : 'Rejected'}: ${note || 'No notes'}`,
      at: new Date(),
    });

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage6(doc.project, userId);

    return this.getBaselineById(doc._id);
  }

  /**
   * Sync Stage 6 with PmsProject lifecycle rail & lock baseline on project
   */
  async syncStage6(projectId, userId = null) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage6 = project.stages.find((s) => s.order === 6);
    if (!stage6) return;

    const bsl = await BaselinePlanning.findOne({ project: projectId, deletedAt: null }).lean();
    if (!bsl) return;

    // Stage 6 checklist: ['Planned Material', 'Planned Labour', 'Planned Timeline', 'Planned Cashflow']
    const hasMat = bsl.plannedMaterial?.status === 'completed';
    const hasLab = bsl.plannedLabour?.status === 'completed';
    const hasTime = bsl.plannedTimeline?.status === 'completed';
    const hasCash = bsl.plannedCashflow?.status === 'completed';
    const isLocked = bsl.baselineLock?.isLocked === true;

    if (stage6.checklist[0]) {
      stage6.checklist[0].done = hasMat;
      stage6.checklist[0].auto = true;
    }
    if (stage6.checklist[1]) {
      stage6.checklist[1].done = hasLab;
      stage6.checklist[1].auto = true;
    }
    if (stage6.checklist[2]) {
      stage6.checklist[2].done = hasTime;
      stage6.checklist[2].auto = true;
    }
    if (stage6.checklist[3]) {
      stage6.checklist[3].done = hasCash;
      stage6.checklist[3].auto = true;
    }

    // If all 4 done and baseline is locked:
    if (hasMat && hasLab && hasTime && hasCash && isLocked) {
      stage6.approved = true;
      stage6.approvedAt = new Date();
      project.baselineLocked = true;

      // Update planned budget snapshot on project
      if (bsl.baselineLock?.totalBaselineBudget > 0) {
        project.plannedBudget = bsl.baselineLock.totalBaselineBudget;
      }

      if (project.stageOrder === 6) {
        project.stageOrder = 7; // Advance to Stage 7: Civil Execution!
      }
    }

    await project.save();
  }
}

module.exports = new BaselinePlanningService();
