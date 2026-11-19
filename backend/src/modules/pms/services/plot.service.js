const Plot = require('../models/plot.model');
const Feasibility = require('../models/feasibility.model');
const PmsProject = require('../models/pmsProject.model');

class PlotService {
  /**
   * Get Plot Scouting & Land Acquisition KPIs
   */
  async getKPIs(projectId = null) {
    const query = { deletedAt: null };
    if (projectId) query.project = projectId;

    const plots = await Plot.find(query).lean();

    const total = plots.length;
    const identified = plots.filter((p) => p.status === 'identified').length;
    const visitScheduled = plots.filter((p) => ['visitScheduled', 'visited'].includes(p.status)).length;
    const underAnalysis = plots.filter((p) => ['underAnalysis', 'feasibilityDone'].includes(p.status)).length;
    const approved = plots.filter((p) => p.status === 'approved').length;
    const rejected = plots.filter((p) => p.status === 'rejected').length;

    // Total expected land acquisition capital
    const totalExpectedCapital = plots.reduce((acc, p) => acc + (Number(p.expectedTotalPrice) || 0), 0);

    return {
      total,
      identified,
      visitScheduled,
      underAnalysis,
      approved,
      rejected,
      totalExpectedCapital,
    };
  }

  /**
   * List plots with pagination, filtering, search, and sorting
   */
  async listPlots({
    page = 1,
    limit = 15,
    search = '',
    projectId = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const query = { deletedAt: null };

    if (projectId && projectId !== 'all') {
      query.project = projectId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { code: regex },
        { surveyNumber: regex },
        { 'location.village': regex },
        { 'location.tehsil': regex },
        { 'owner.name': regex },
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (currentPage - 1) * perPage;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [plots, total] = await Promise.all([
      Plot.find(query)
        .populate('project', 'name code plannedBudget')
        .populate('assignedEngineer', 'name email phone')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .lean(),
      Plot.countDocuments(query),
    ]);

    // Attach feasibility verdict for each plot
    const plotIds = plots.map((p) => p._id);
    const feasibilities = await Feasibility.find({ plot: { $in: plotIds }, deletedAt: null })
      .select('plot verdict status projections')
      .lean();

    const feasMap = new Map();
    feasibilities.forEach((f) => feasMap.set(String(f.plot), f));

    const data = plots.map((p) => {
      const f = feasMap.get(String(p._id));
      return {
        ...p,
        feasibility: f || null,
        verdict: f ? f.verdict : 'pending',
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
   * Get single plot by ID with chained feasibility record
   */
  async getPlotById(id) {
    const plot = await Plot.findOne({ _id: id, deletedAt: null })
      .populate('project', 'name code locality city stageOrder baselineLocked')
      .populate('assignedEngineer', 'name email phone')
      .populate('createdBy', 'name email')
      .lean();

    if (!plot) {
      const err = new Error('Land Plot not found');
      err.status = 404;
      throw err;
    }

    const feasibility = await Feasibility.findOne({ plot: id, deletedAt: null })
      .populate('decidedBy', 'name email')
      .lean();

    return {
      ...plot,
      feasibility: feasibility || null,
    };
  }

  /**
   * Create new land plot
   */
  async createPlot(data, userId) {
    let code = data.code ? data.code.trim().toUpperCase() : '';
    if (!code) {
      const count = await Plot.countDocuments();
      code = `PLT-${String(count + 1).padStart(3, '0')}`;
    }

    const areaValue = Number(data.area?.value || data.areaValue || 0);
    const expectedRate = Number(data.expectedRatePerUnit || 0);
    const expectedTotalPrice = data.expectedTotalPrice ? Number(data.expectedTotalPrice) : areaValue * expectedRate;

    const plot = new Plot({
      ...data,
      code,
      area: {
        value: areaValue,
        unit: data.area?.unit || data.areaUnit || 'sqyd',
      },
      expectedRatePerUnit: expectedRate,
      expectedTotalPrice,
      status: 'identified',
      statusHistory: [
        {
          from: '',
          to: 'identified',
          at: new Date(),
          by: userId,
          reason: 'Initial land plot identified and scouted',
        },
      ],
      createdBy: userId,
      updatedBy: userId,
    });

    await plot.save();

    // Sync Stage 1 item 0 (Plot Search) on project
    await this.syncStage1Progress(plot.project);

    return plot;
  }

  /**
   * Update plot details
   */
  async updatePlot(id, data, userId) {
    const plot = await Plot.findOne({ _id: id, deletedAt: null });
    if (!plot) {
      const err = new Error('Land Plot not found');
      err.status = 404;
      throw err;
    }

    const allowed = [
      'title',
      'surveyNumber',
      'location',
      'area',
      'expectedRatePerUnit',
      'expectedTotalPrice',
      'owner',
      'source',
      'broker',
      'zoning',
      'assignedEngineer',
      'notes',
    ];

    allowed.forEach((f) => {
      if (data[f] !== undefined) plot[f] = data[f];
    });

    if (data.areaValue) {
      plot.area.value = Number(data.areaValue);
    }
    if (data.areaUnit) {
      plot.area.unit = data.areaUnit;
    }

    if (plot.area?.value && plot.expectedRatePerUnit) {
      plot.expectedTotalPrice = plot.area.value * plot.expectedRatePerUnit;
    }

    plot.updatedBy = userId;
    await plot.save();
    return plot;
  }

  /**
   * Delete Plot (Soft delete)
   */
  async deletePlot(id, userId) {
    const plot = await Plot.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: userId },
      { new: true }
    );
    if (!plot) {
      const err = new Error('Land Plot not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Plot removed successfully' };
  }

  /**
   * Transition plot status machine and sync stage-1
   */
  async transitionStatus(id, newStatus, reason = '', userId) {
    const plot = await Plot.findOne({ _id: id, deletedAt: null });
    if (!plot) {
      const err = new Error('Land Plot not found');
      err.status = 404;
      throw err;
    }

    const oldStatus = plot.status;
    plot.status = newStatus;
    plot.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      at: new Date(),
      by: userId,
      reason,
    });
    plot.updatedBy = userId;
    await plot.save();

    await this.syncStage1Progress(plot.project);

    return plot;
  }

  /**
   * Sync Stage 1 checklist on PmsProject
   */
  async syncStage1Progress(projectId) {
    if (!projectId) return;
    const project = await PmsProject.findOne({ _id: projectId, deletedAt: null });
    if (!project || !project.stages || project.stages.length === 0) return;

    const stage1 = project.stages[0];
    if (!stage1 || !stage1.checklist) return;

    // Check how many plots exist for this project
    const plotCount = await Plot.countDocuments({ project: projectId, deletedAt: null });
    if (plotCount > 0 && stage1.checklist[0]) {
      stage1.checklist[0].done = true;
      stage1.checklist[0].auto = true;
      stage1.checklist[0].completedAt = new Date();
    }

    // Check if any plot has been visited
    const visitedCount = await Plot.countDocuments({
      project: projectId,
      deletedAt: null,
      status: { $in: ['visited', 'underAnalysis', 'feasibilityDone', 'approved'] },
    });
    if (visitedCount > 0 && stage1.checklist[1]) {
      stage1.checklist[1].done = true;
      stage1.checklist[1].auto = true;
      stage1.checklist[1].completedAt = new Date();
    }

    // Check if any plot has completed market analysis or feasibility
    const feasCount = await Feasibility.countDocuments({
      project: projectId,
      deletedAt: null,
      status: { $in: ['submitted', 'approved'] },
    });
    if (feasCount > 0 && stage1.checklist[2]) {
      stage1.checklist[2].done = true;
      stage1.checklist[2].auto = true;
      stage1.checklist[2].completedAt = new Date();
    }

    // Check if approved feasibility exists
    const approvedFeas = await Feasibility.findOne({
      project: projectId,
      deletedAt: null,
      status: 'approved',
      verdict: { $in: ['feasible', 'feasibleWithConditions'] },
    });
    if (approvedFeas && stage1.checklist[3]) {
      stage1.checklist[3].done = true;
      stage1.checklist[3].auto = true;
      stage1.checklist[3].completedAt = new Date();
      project.selectedPlot = approvedFeas.plot;
    }

    await project.save();
  }
}

module.exports = new PlotService();
