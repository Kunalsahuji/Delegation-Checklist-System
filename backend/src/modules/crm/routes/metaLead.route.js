const express = require('express');
const router = express.Router();
const metaLeadController = require('../controllers/metaLead.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI Stats
router.get('/kpis', metaLeadController.getKPIs);

// Sync
router.post('/sync', metaLeadController.syncLeads);

// Batch assign leads to sales team
router.post('/assign', metaLeadController.assignLeads);

// Leads CRUD
router.get('/', metaLeadController.listLeads);
router.post('/', metaLeadController.createLead);
router.patch('/:id/skip', metaLeadController.skipLead);
router.delete('/:id', metaLeadController.deleteLead);

module.exports = router;
