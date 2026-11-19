const Feasibility = require('../models/feasibility.model');
const Plot = require('../models/plot.model');
const plotService = require('./plot.service');

class FeasibilityService {
  /**
   * Helper to compute feasibility financials
   */
  calculateFinancials(costs = {}, projections = {}) {
    const landCost = Number(costs.landCost) || 0;
    const developmentCost = Number(costs.developmentCost) || 0;
    const approvalCost = Number(costs.approvalCost) || 0;
    const financeCost = Number(costs.financeCost) || 0;
    const otherCost = Number(costs.otherCost) || 0;
    const totalCost = landCost + developmentCost + approvalCost + financeCost + otherCost;

    const expectedRevenue = Number(projections.expectedRevenue) || 0;
    const expectedProfit = expectedRevenue - totalCost;
    const marginPct = expectedRevenue > 0 ? Number(((expectedProfit / expectedRevenue) * 100).toFixed(1)) : 0;
    const roiPct = totalCost > 0 ? Number(((expectedProfit / totalCost) * 100).toFixed(1)) : 0;
    const paybackMonths = Number(projections.paybackMonths) || 0;

    return {
      costs: {
        landCost,
        developmentCost,
        approvalCost,
        financeCost,
        otherCost,
        totalCost,
      },
      projections: {
        expectedRevenue,
        expectedProfit,
        marginPct,
        roiPct,
        paybackMonths,
      },
    };
  }

  /**
   * Get feasibility by plot ID
   */
  async getFeasibilityByPlot(plotId) {
    return await Feasibility.findOne({ plot: plotId, deletedAt: null })
      .populate('decidedBy', 'name email avatar')
      .populate('createdBy', 'name email')
      .lean();
  }

  /**
   * Create or update feasibility for a plot
   */
  async saveFeasibility(plotId, data, userId) {
    const plot = await Plot.findOne({ _id: plotId, deletedAt: null });
    if (!plot) {
      const err = new Error('Plot not found');
      err.status = 404;
      throw err;
    }

    const { costs, projections } = this.calculateFinancials(data.costs, data.projections);

    let feasibility = await Feasibility.findOne({ plot: plotId, deletedAt: null });

    if (feasibility) {
      feasibility.costs = costs;
      feasibility.projections = projections;
      if (data.risks) feasibility.risks = data.risks;
      if (data.verdict) feasibility.verdict = data.verdict;
      if (data.conditions !== undefined) feasibility.conditions = data.conditions;
      feasibility.status = data.status || feasibility.status;
      feasibility.updatedBy = userId;
      await feasibility.save();
    } else {
      const count = await Feasibility.countDocuments();
      const code = `FSB-${String(count + 1).padStart(3, '0')}`;

      feasibility = new Feasibility({
        code,
        project: plot.project,
        plot: plot._id,
        costs,
        projections,
        risks: data.risks || [],
        verdict: data.verdict || 'pending',
        conditions: data.conditions || '',
        status: data.status || 'draft',
        createdBy: userId,
        updatedBy: userId,
      });

      await feasibility.save();
    }

    // Update plot status to underAnalysis or feasibilityDone
    if (plot.status === 'identified' || plot.status === 'visited') {
      await plotService.transitionStatus(plot._id, 'feasibilityDone', 'Feasibility assessment computed', userId);
    }

    return feasibility;
  }

  /**
   * Approve or reject feasibility decision (Approval Gate)
   */
  async decideFeasibility(id, { verdict, conditions = '' }, userId) {
    const feasibility = await Feasibility.findOne({ _id: id, deletedAt: null });
    if (!feasibility) {
      const err = new Error('Feasibility record not found');
      err.status = 404;
      throw err;
    }

    feasibility.verdict = verdict;
    feasibility.conditions = conditions;
    feasibility.status = verdict === 'notFeasible' ? 'rejected' : 'approved';
    feasibility.decidedBy = userId;
    feasibility.decidedAt = new Date();
    feasibility.updatedBy = userId;
    await feasibility.save();

    // Transition plot status
    const plotNewStatus = verdict === 'notFeasible' ? 'rejected' : 'approved';
    await plotService.transitionStatus(
      feasibility.plot,
      plotNewStatus,
      `Feasibility verdict: ${verdict}. ${conditions ? `Conditions: ${conditions}` : ''}`,
      userId
    );

    // Sync Stage 1 checklist on project
    await plotService.syncStage1Progress(feasibility.project);

    return feasibility;
  }
}

module.exports = new FeasibilityService();
