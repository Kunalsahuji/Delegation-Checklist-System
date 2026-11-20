const ProjectPlanning = require('../models/projectPlanning.model');
const PmsProject = require('../models/pmsProject.model');
const Plot = require('../models/plot.model');
const LandPurchase = require('../models/landPurchase.model');
const Feasibility = require('../models/feasibility.model');
const {
  PLANNING_SECTION_KEYS,
  PROJECT_PLANNING_STATUS,
} = require('../constants/pms.constants');

const SECTION_LABEL = {
  survey: 'Survey',
  masterLayout: 'Master Layout',
  roadPlanning: 'Road Planning',
  amenities: 'Amenities',
  plotVillaPlanning: 'Plot & Villa Planning',
  budget: 'Development Budget',
};

class ProjectPlanningService {
  /**
   * Advance status to the next incomplete planning section
   */
  advanceStatus(doc, userId) {
    if (['approved', 'pendingGovernmentApproval', 'cancelled'].includes(doc.status)) return;
    const next = PLANNING_SECTION_KEYS.find((k) => doc[k]?.status !== 'completed');
    const to = next || 'managementApproval';
    if (doc.status !== to) {
      doc.statusHistory.push({
        from: doc.status,
        to,
        by: userId,
        reason: next ? `Now at ${SECTION_LABEL[next]}` : 'Ready for management approval',
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

    const plans = await ProjectPlanning.find(filter).lean();

    const total = plans.length;
    const inPlanning = plans.filter((p) =>
      ['survey', 'masterLayout', 'roadPlanning', 'amenities', 'plotVillaPlanning', 'budget'].includes(p.status)
    ).length;
    const approvalPending = plans.filter((p) => p.status === 'managementApproval').length;
    const approved = plans.filter((p) => ['approved', 'pendingGovernmentApproval'].includes(p.status)).length;

    const totalEstimatedDevelopmentBudget = plans.reduce(
      (acc, p) => acc + (Number(p.budget?.totalEstimatedCost) || 0),
      0
    );

    const totalPlots = plans.reduce((acc, p) => acc + (Number(p.plotVillaPlanning?.totalPlots) || 0), 0);
    const totalVillas = plans.reduce((acc, p) => acc + (Number(p.plotVillaPlanning?.totalVillas) || 0), 0);

    return {
      total,
      inPlanning,
      approvalPending,
      approved,
      totalEstimatedDevelopmentBudget,
      totalPlots,
      totalVillas,
    };
  }

  /**
   * Filterable paginated list of project planning records
   */
  async listPlans(query = {}) {
    const {
      page = 1,
      limit = 15,
      search = '',
      status,
      projectType,
      projectId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = { deletedAt: null };
    if (projectId) filter.project = projectId;
    if (projectType && projectType !== 'all') filter.projectType = projectType;
    if (status && status !== 'all') filter.status = status;

    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ code: rx }, { 'masterLayout.architect': rx }, { notes: rx }];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const [data, total] = await Promise.all([
      ProjectPlanning.find(filter)
        .populate('project', 'name code locality status stageOrder')
        .populate('plot', 'code title surveyNumber area')
        .populate('landPurchase', 'code totalCost status')
        .populate('feasibility', 'code verdict projections costs')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      ProjectPlanning.countDocuments(filter),
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
   * Get single planning record by ID
   */
  async getPlanById(id) {
    const plan = await ProjectPlanning.findOne({ _id: id, deletedAt: null })
      .populate('project', 'name code locality stages plannedBudget stageOrder')
      .populate('plot')
      .populate('landPurchase')
      .populate('feasibility')
      .populate('managementApproval.decidedBy', 'name email avatar')
      .populate('managementApproval.requestedBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!plan) {
      const err = new Error('Project planning record not found');
      err.status = 404;
      throw err;
    }

    return plan;
  }

  /**
   * Module 03 -> Module 04 Handoff: Open project planning for project
   */
  async createFromProject({ projectId }, userId) {
    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    // Check if active plan already exists
    const existing = await ProjectPlanning.findOne({ project: projectId, deletedAt: null });
    if (existing) {
      const populated = await this.getPlanById(existing._id);
      return { projectPlanning: populated, created: false };
    }

    const plot = await Plot.findOne({ project: projectId, status: 'approved', deletedAt: null }).lean();
    const purchase = await LandPurchase.findOne({ project: projectId, deletedAt: null }).lean();
    const feasibility = await Feasibility.findOne({ project: projectId, deletedAt: null }).lean();

    const count = await ProjectPlanning.countDocuments();
    const code = `PLN-${String(count + 1).padStart(6, '0')}`;
    const now = new Date();

    const plan = new ProjectPlanning({
      code,
      project: projectId,
      plot: plot?._id || null,
      landPurchase: purchase?._id || null,
      feasibility: feasibility?._id || null,
      projectType: 'plotting',
      areaUnit: plot?.area?.unit || 'sqyd',
      landAreaSnapshot: {
        value: plot?.area?.value || 0,
        unit: plot?.area?.unit || 'sqyd',
      },
      estimatedDevelopmentCost: feasibility?.costs?.developmentCost || 45000000,
      status: 'survey',
      statusHistory: [
        {
          from: '',
          to: 'survey',
          by: userId,
          reason: `Project planning initiated for ${project.name}`,
          at: now,
        },
      ],
      createdBy: userId,
    });

    await plan.save();
    await this.syncStage4(projectId);

    const populated = await this.getPlanById(plan._id);
    return { projectPlanning: populated, created: true };
  }

  /**
   * Section Blockers helper
   */
  sectionBlockers(doc, key) {
    const s = doc[key] || {};
    const blockers = [];

    switch (key) {
      case 'survey':
        if (!String(s.surveyNumber || '').trim()) blockers.push('Record survey boundary number');
        if (!s.surveyDate) blockers.push('Record survey date');
        if (!(Number(s.surveyedArea) > 0)) blockers.push('Record surveyed land area');
        break;
      case 'masterLayout':
        if (!String(s.layoutNumber || '').trim()) blockers.push('Record layout drawing number');
        if (!(Number(s.totalArea) > 0)) blockers.push('Record total scheme area');
        if (!(Number(s.saleableArea) > 0)) blockers.push('Record saleable carpet area');
        break;
      case 'roadPlanning':
        if (!Array.isArray(s.roads) || s.roads.length === 0) {
          blockers.push('Define at least one road in road schedule');
        }
        break;
      case 'amenities':
        if (!Array.isArray(s.items) || s.items.filter((a) => a.included).length === 0) {
          blockers.push('Include at least one planned amenity');
        }
        break;
      case 'plotVillaPlanning':
        if (Number(s.totalPlots) <= 0 && Number(s.totalVillas) <= 0) {
          blockers.push('Declare total count of plots or villas');
        }
        break;
      case 'budget':
        if (!(Number(s.totalEstimatedCost) > 0)) {
          blockers.push('Define development budget cost heads');
        }
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
    if (!PLANNING_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown planning section key');
      err.status = 400;
      throw err;
    }

    const doc = await ProjectPlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Project planning record not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];

    // Handle roads array
    if (sectionKey === 'roadPlanning' && Array.isArray(patch.roads)) {
      section.roads = patch.roads;
    }

    // Handle amenities array
    if (sectionKey === 'amenities' && Array.isArray(patch.items)) {
      section.items = patch.items;
    }

    // Handle categories array
    if (sectionKey === 'plotVillaPlanning' && Array.isArray(patch.categories)) {
      section.categories = patch.categories;
      if (patch.totalPlots === undefined) {
        section.totalPlots = patch.categories
          .filter((c) => c.kind === 'plot' || c.kind === 'commercial')
          .reduce((sum, c) => sum + (Number(c.count) || 0), 0);
      }
      if (patch.totalVillas === undefined) {
        section.totalVillas = patch.categories
          .filter((c) => c.kind === 'villa')
          .reduce((sum, c) => sum + (Number(c.count) || 0), 0);
      }
    }

    // Scalar merges
    Object.keys(patch).forEach((k) => {
      if (k !== 'roads' && k !== 'items' && k !== 'categories' && section[k] !== undefined) {
        section[k] = patch[k];
      }
    });

    if (section.status === 'pending') {
      section.status = 'inProgress';
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage4(doc.project);

    return this.getPlanById(id);
  }

  /**
   * Mark a section as completed
   */
  async completeSection(id, sectionKey, userId) {
    if (!PLANNING_SECTION_KEYS.includes(sectionKey)) {
      const err = new Error('Unknown planning section key');
      err.status = 400;
      throw err;
    }

    const doc = await ProjectPlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Project planning record not found');
      err.status = 404;
      throw err;
    }

    const section = doc[sectionKey];
    if (section.status === 'completed') {
      return this.getPlanById(id);
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
    await this.syncStage4(doc.project);

    return this.getPlanById(id);
  }

  /**
   * Request management approval for master plan & budget
   */
  async requestApproval(id, { note = '' }, userId) {
    const doc = await ProjectPlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Project planning record not found');
      err.status = 404;
      throw err;
    }

    doc.managementApproval.requestedBy = userId;
    doc.managementApproval.requestedAt = new Date();
    doc.managementApproval.decision = '';
    doc.managementApproval.note = note;

    doc.statusHistory.push({
      from: doc.status,
      to: 'managementApproval',
      by: userId,
      reason: note || 'Master plan and development budget submitted for management sanction',
      at: new Date(),
    });
    doc.status = 'managementApproval';
    doc.updatedBy = userId;

    await doc.save();
    return this.getPlanById(id);
  }

  /**
   * Decision Gate for Management Approval
   */
  async decideApproval(id, { decision, note = '' }, userId) {
    const doc = await ProjectPlanning.findOne({ _id: id, deletedAt: null });
    if (!doc) {
      const err = new Error('Project planning record not found');
      err.status = 404;
      throw err;
    }

    const now = new Date();
    doc.managementApproval.decision = decision;
    doc.managementApproval.decidedBy = userId;
    doc.managementApproval.decidedAt = now;
    doc.managementApproval.note = note;
    doc.managementApproval.history.push({
      decision,
      note,
      budgetAtDecision: doc.budget?.totalEstimatedCost || 0,
      by: userId,
      at: now,
    });

    if (decision === 'approved') {
      doc.status = 'approved';
      doc.approvedAt = now;
      doc.statusHistory.push({
        from: 'managementApproval',
        to: 'approved',
        by: userId,
        reason: note || 'Master plan and budget formally approved by management',
        at: now,
      });
    } else {
      doc.status = 'budget';
      doc.budget.status = 'inProgress';
      doc.statusHistory.push({
        from: 'managementApproval',
        to: 'budget',
        by: userId,
        reason: note || 'Plan returned for budget / layout revision',
        at: now,
      });
    }

    doc.updatedBy = userId;
    await doc.save();
    await this.syncStage4(doc.project);

    return this.getPlanById(id);
  }

  /**
   * Sync Stage 4 checklist on PmsProject
   */
  async syncStage4(projectId) {
    if (!projectId) return;

    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project) return;

    const stage4 = project.stages.find((s) => s.order === 4);
    if (!stage4) return;

    const plan = await ProjectPlanning.findOne({ project: projectId, deletedAt: null }).lean();
    if (!plan) return;

    // Stage 4 checklist: ['Survey & Layout', 'Roads & Amenities', 'Estimated Budget', 'Management Approval', 'Government Approval & NOC']
    const hasSurveyLayout =
      plan.survey?.status === 'completed' && plan.masterLayout?.status === 'completed';
    const hasRoadsAmenities =
      plan.roadPlanning?.status === 'completed' && plan.amenities?.status === 'completed';
    const hasBudget = plan.budget?.status === 'completed';
    const hasMgmtApproval = plan.managementApproval?.decision === 'approved';

    if (stage4.checklist[0]) {
      stage4.checklist[0].done = hasSurveyLayout;
      stage4.checklist[0].auto = true;
    }
    if (stage4.checklist[1]) {
      stage4.checklist[1].done = hasRoadsAmenities;
      stage4.checklist[1].auto = true;
    }
    if (stage4.checklist[2]) {
      stage4.checklist[2].done = hasBudget;
      stage4.checklist[2].auto = true;
    }
    if (stage4.checklist[3]) {
      stage4.checklist[3].done = hasMgmtApproval;
      stage4.checklist[3].auto = true;
    }

    // If all items 0..3 done and management approved, mark stage 4 approved and advance to stage 5
    if (hasSurveyLayout && hasRoadsAmenities && hasBudget && hasMgmtApproval) {
      if (stage4.checklist[4]) {
        stage4.checklist[4].done = true;
        stage4.checklist[4].auto = true;
      }
      stage4.approved = true;
      stage4.approvedAt = new Date();

      if (project.stageOrder === 4) {
        project.stageOrder = 5; // Advance to Stage 5: Pre-Site Start
      }
    }

    await project.save();
  }
}

module.exports = new ProjectPlanningService();
