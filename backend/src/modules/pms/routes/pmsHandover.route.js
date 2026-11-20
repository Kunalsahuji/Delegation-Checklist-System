const express = require('express');
const router = express.Router();
const pmsHandoverController = require('../controllers/pmsHandover.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI aggregation
router.get('/kpis', pmsHandoverController.getKPIs);

// List with filters & pagination
router.get('/', pmsHandoverController.listRecords);

// Initialize / create handover from project
router.post('/from-project', pmsHandoverController.createFromProject);

// Single record details
router.get('/:id', pmsHandoverController.getRecordById);

// Update section data (support both section and sections)
router.put('/:id/section/:sectionKey', pmsHandoverController.updateSection);
router.put('/:id/sections/:sectionKey', pmsHandoverController.updateSection);

// Mark section as completed
router.post('/:id/section/:sectionKey/complete', pmsHandoverController.completeSection);
router.post('/:id/sections/:sectionKey/complete', pmsHandoverController.completeSection);

// Request approval
router.post('/:id/request-approval', pmsHandoverController.requestApproval);

// Decide approval (approve / reject)
router.post('/:id/decide-approval', pmsHandoverController.decideApproval);

module.exports = router;
