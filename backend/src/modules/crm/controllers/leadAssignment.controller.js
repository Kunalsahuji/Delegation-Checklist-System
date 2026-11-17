const leadAssignmentService = require('../services/leadAssignment.service');

const getKPIs = async (req, res, next) => {
  try {
    const kpis = await leadAssignmentService.getKPIs();
    return res.status(200).json({ success: true, data: kpis });
  } catch (error) {
    next(error);
  }
};

const getWorkload = async (req, res, next) => {
  try {
    const workload = await leadAssignmentService.getWorkload();
    return res.status(200).json({ success: true, data: workload });
  } catch (error) {
    next(error);
  }
};

const listQualifiedLeads = async (req, res, next) => {
  try {
    const result = await leadAssignmentService.listQualifiedLeads(req.query);
    return res.status(200).json({
      success: true,
      data: result.leads,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const assignLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { assignedTo, reason, triggerType } = req.body;
    const actor = req.user || null;
    const result = await leadAssignmentService.assignLead(
      leadId,
      { assignedTo, reason, triggerType },
      actor
    );
    return res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const unassignLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { reason } = req.body;
    const actor = req.user || null;
    const result = await leadAssignmentService.unassignLead(leadId, { reason }, actor);
    return res.status(200).json({
      success: true,
      message: 'Lead unassigned successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkAssign = async (req, res, next) => {
  try {
    const { leadIds, assignedTo, reason } = req.body;
    const actor = req.user || null;
    const result = await leadAssignmentService.bulkAssign(
      { leadIds, assignedTo, reason },
      actor
    );
    return res.status(200).json({
      success: true,
      message: `Bulk assignment completed (${result.assignedCount} leads assigned)`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const autoDistribute = async (req, res, next) => {
  try {
    const { leadIds } = req.body;
    const actor = req.user || null;
    const result = await leadAssignmentService.autoDistributeRoundRobin(
      { leadIds },
      actor
    );
    return res.status(200).json({
      success: true,
      message: `Round-robin distribution completed (${result.assignedCount} leads distributed)`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLeadHistory = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const history = await leadAssignmentService.getLeadAssignmentHistory(leadId);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKPIs,
  getWorkload,
  listQualifiedLeads,
  assignLead,
  unassignLead,
  bulkAssign,
  autoDistribute,
  getLeadHistory,
};
