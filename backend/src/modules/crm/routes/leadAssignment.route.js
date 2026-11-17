const express = require('express');
const router = express.Router();
const leadAssignmentController = require('../controllers/leadAssignment.controller');
const { auth } = require('../../../middlewares/auth.middleware');

// Public or authenticated endpoints
router.use(auth);

// KPI strip & Workload metrics
router.get('/kpis', leadAssignmentController.getKPIs);
router.get('/workload', leadAssignmentController.getWorkload);

// Lead assignment list
router.get('/leads', leadAssignmentController.listQualifiedLeads);

// Single lead assign / unassign
router.post('/leads/:leadId/assign', leadAssignmentController.assignLead);
router.post('/leads/:leadId/unassign', leadAssignmentController.unassignLead);
router.get('/leads/:leadId/history', leadAssignmentController.getLeadHistory);

// Bulk & automated distribution
router.post('/bulk-assign', leadAssignmentController.bulkAssign);
router.post('/auto-distribute', leadAssignmentController.autoDistribute);

module.exports = router;
