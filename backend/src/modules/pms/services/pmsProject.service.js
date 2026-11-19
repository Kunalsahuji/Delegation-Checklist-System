const PmsProject = require('../models/pmsProject.model');
const { LIFECYCLE_STAGES, BASELINE_LOCK_ORDER } = require('../constants/pms.constants');

class PmsProjectService {
  /**
   * Instantiate the default 13-stage lifecycle rail
   */
  buildDefaultStages() {
    return LIFECYCLE_STAGES.map((def) => ({
      order: def.order,
      key: def.key,
      name: def.name,
      shortName: def.shortName || `S${def.order} • ${def.name}`,
      checklist: (def.checklist || []).map((label) => ({
        label,
        done: false,
        auto: false,
        completedAt: null,
        completedBy: null,
      })),
      docs: [],
      docSlots: def.docs || [],
      locksBaseline: !!def.locksBaseline,
      approved: false,
      approvedAt: null,
      approvedBy: null,
    }));
  }

  /**
   * Get PMS Overview KPIs
   */
  async getKPIs() {
    const projects = await PmsProject.find({ deletedAt: null }).lean();

    const total = projects.length;
    const underConstruction = projects.filter((p) => p.status === 'active').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const planning = projects.filter((p) => p.status === 'planning').length;
    const onHold = projects.filter((p) => p.status === 'onHold').length;

    const plannedBudget = projects.reduce((acc, p) => acc + (Number(p.plannedBudget) || 0), 0);
    const actualSpend = projects.reduce((acc, p) => acc + (Number(p.actualSpend) || 0), 0);

    // Calculate overall portfolio stage progression %
    const totalStagesCompleted = projects.reduce((acc, p) => {
      const doneStages = (p.stages || []).filter((s) => s.approved).length;
      return acc + doneStages;
    }, 0);
    const maxPossibleStages = total > 0 ? total * 13 : 1;
    const portfolioProgress = Math.round((totalStagesCompleted / maxPossibleStages) * 100);

    return {
      total,
      underConstruction,
      completed,
      planning,
      onHold,
      plannedBudget,
      actualSpend,
      portfolioProgress,
    };
  }

  /**
   * List projects with search, filters, pagination, and sorting
   */
  async listProjects({
    page = 1,
    limit = 15,
    search = '',
    status = '',
    stageOrder = null,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const query = { deletedAt: null };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { code: regex }, { locality: regex }, { city: regex }];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (stageOrder && !isNaN(stageOrder)) {
      query.stageOrder = Number(stageOrder);
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (currentPage - 1) * perPage;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [projects, total] = await Promise.all([
      PmsProject.find(query)
        .populate('createdBy', 'name email')
        .populate('pendingSiteEngineer', 'name email phone')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .lean(),
      PmsProject.countDocuments(query),
    ]);

    // Attach computed stage progress %
    const data = projects.map((proj) => {
      const stages = proj.stages || [];
      const currentStage = stages.find((s) => s.order === proj.stageOrder) || stages[0];
      const approvedCount = stages.filter((s) => s.approved).length;
      const progressPercent = Math.round((approvedCount / 13) * 100);

      return {
        ...proj,
        currentStageName: currentStage ? currentStage.name : 'Land Acquisition',
        progressPercent,
      };
    });

    return {
      data,
      total,
      page: currentPage,
      limit: perPage,
      totalPages: Math.ceil(total / perPage) || 1,
    };
  }

  /**
   * Get single project by ID with full stage data
   */
  async getProjectById(id) {
    const project = await PmsProject.findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('pendingSiteEngineer', 'name email phone')
      .lean();

    if (!project) {
      const err = new Error('PMS Project not found');
      err.status = 404;
      throw err;
    }

    return project;
  }

  /**
   * Create new PMS Project
   */
  async createProject(data, userId) {
    // Generate code if missing
    let code = data.code ? data.code.trim().toUpperCase() : '';
    if (!code) {
      const count = await PmsProject.countDocuments();
      code = `PRJ-${String(count + 1).padStart(3, '0')}`;
    }

    const stages = this.buildDefaultStages();

    const project = new PmsProject({
      ...data,
      code,
      stages,
      stageOrder: 1,
      baselineLocked: false,
      createdBy: userId,
      updatedBy: userId,
    });

    await project.save();
    return project;
  }

  /**
   * Update Project metadata
   */
  async updateProject(id, data, userId) {
    const project = await PmsProject.findOne({ _id: id, deletedAt: null });
    if (!project) {
      const err = new Error('PMS Project not found');
      err.status = 404;
      throw err;
    }

    // Editable fields
    const allowed = [
      'name',
      'nameHi',
      'locality',
      'city',
      'description',
      'plannedBudget',
      'actualSpend',
      'totalVillas',
      'totalPlots',
      'startedAt',
      'targetCompletionAt',
      'status',
      'pendingSiteEngineer',
    ];

    allowed.forEach((field) => {
      if (data[field] !== undefined) {
        project[field] = data[field];
      }
    });

    project.updatedBy = userId;
    await project.save();
    return project;
  }

  /**
   * Delete Project (Soft Delete)
   */
  async deleteProject(id, userId) {
    const project = await PmsProject.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: userId },
      { new: true }
    );

    if (!project) {
      const err = new Error('PMS Project not found');
      err.status = 404;
      throw err;
    }

    return { message: 'Project deleted successfully' };
  }

  /**
   * Toggle a checklist item inside a project stage
   */
  async toggleChecklistItem(id, stageOrder, itemIndex, userId) {
    const project = await PmsProject.findOne({ _id: id, deletedAt: null });
    if (!project) {
      const err = new Error('PMS Project not found');
      err.status = 404;
      throw err;
    }

    const stage = project.stages.find((s) => s.order === Number(stageOrder));
    if (!stage) {
      const err = new Error(`Stage ${stageOrder} not found`);
      err.status = 404;
      throw err;
    }

    const item = stage.checklist[itemIndex];
    if (!item) {
      const err = new Error(`Checklist item at index ${itemIndex} not found`);
      err.status = 404;
      throw err;
    }

    if (item.auto) {
      const err = new Error('Automatic checklist items are synchronized from subsystem records and cannot be toggled manually.');
      err.status = 400;
      throw err;
    }

    item.done = !item.done;
    item.completedAt = item.done ? new Date() : null;
    item.completedBy = item.done ? userId : null;

    project.updatedBy = userId;
    await project.save();
    return project;
  }

  /**
   * Advance Stage Gate
   * Verifies all checklist items for current stage are done before approving & advancing
   */
  async advanceStage(id, userId) {
    const project = await PmsProject.findOne({ _id: id, deletedAt: null });
    if (!project) {
      const err = new Error('PMS Project not found');
      err.status = 404;
      throw err;
    }

    const currentStage = project.stages.find((s) => s.order === project.stageOrder);
    if (!currentStage) {
      const err = new Error('Current stage not found in project');
      err.status = 400;
      throw err;
    }

    // Verify all checklist items in current stage are complete
    const pendingItems = (currentStage.checklist || []).filter((i) => !i.done);
    if (pendingItems.length > 0) {
      const err = new Error(
        `Cannot advance: Stage ${currentStage.order} has ${pendingItems.length} incomplete checklist item(s): ${pendingItems
          .map((i) => `"${i.label}"`)
          .join(', ')}`
      );
      err.status = 400;
      throw err;
    }

    // Approve current stage
    currentStage.approved = true;
    currentStage.approvedAt = new Date();
    currentStage.approvedBy = userId;

    // Check if current stage locks baseline (Stage 6)
    if (currentStage.order === BASELINE_LOCK_ORDER) {
      project.baselineLocked = true;
    }

    // Advance to next stage or complete project
    if (project.stageOrder < 13) {
      project.stageOrder += 1;
      if (project.status === 'planning') {
        project.status = 'active'; // Once past initial stages, project is active construction
      }
    } else {
      project.status = 'completed';
    }

    project.updatedBy = userId;
    await project.save();
    return project;
  }
}

module.exports = new PmsProjectService();
