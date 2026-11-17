const leadService = require('../services/lead.service');

async function listStages(req, res) {
  try {
    const stages = await leadService.listStages();
    res.status(200).json({ success: true, data: stages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function listLeads(req, res) {
  try {
    const result = await leadService.listLeads(req.query);
    res.status(200).json({ success: true, ...result, data: result.leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getLeadById(req, res) {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    res.status(200).json({ success: true, data: lead });
  } catch (err) {
    res.status(err.message === 'Lead not found' ? 404 : 500).json({ success: false, message: err.message });
  }
}

async function createLead(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Sales Executive';
    const lead = await leadService.createDirectLead(req.body, actorId, actorName);
    res.status(201).json({ success: true, data: lead, message: 'Lead created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function convertEnquiry(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Tele-caller';
    const lead = await leadService.createFromEnquiry(req.params.enquiryId, actorId, actorName);
    res.status(201).json({ success: true, data: lead, message: 'Enquiry converted to Lead successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function moveStage(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Sales Rep';
    const result = await leadService.moveStage(req.params.id, req.body, actorId, actorName);
    res.status(200).json({ success: true, data: result.lead, history: result.history, message: 'Stage advanced successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function undoStage(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Sales Rep';
    const result = await leadService.undoStage(req.params.id, actorId, actorName);
    res.status(200).json({ success: true, data: result.lead, undoEntry: result.undoEntry, message: 'Reverted to previous stage' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function markWon(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Sales Closer';
    const lead = await leadService.markWon(req.params.id, req.body, actorId, actorName);
    res.status(200).json({ success: true, data: lead, message: 'Deal closed successfully! Marked as Won.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function markLost(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Sales Rep';
    const lead = await leadService.markLost(req.params.id, req.body, actorId, actorName);
    res.status(200).json({ success: true, data: lead, message: 'Lead marked as Lost' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function markDropped(req, res) {
  try {
    const actorId = req.user?._id || null;
    const actorName = req.user?.name || 'Sales Rep';
    const lead = await leadService.markDropped(req.params.id, req.body, actorId, actorName);
    res.status(200).json({ success: true, data: lead, message: 'Lead marked as Dropped' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listStages,
  listLeads,
  getLeadById,
  createLead,
  convertEnquiry,
  moveStage,
  undoStage,
  markWon,
  markLost,
  markDropped,
};
