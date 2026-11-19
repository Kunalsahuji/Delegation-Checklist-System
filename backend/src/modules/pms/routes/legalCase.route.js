const express = require('express');
const router = express.Router();
const legalCaseController = require('../controllers/legalCase.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// Overview KPIs
router.get('/kpis', legalCaseController.getKPIs);

// Interlink handoff from Module 01 (Plot)
router.post('/from-plot', legalCaseController.createFromPlot);

// Workflow actions
router.put('/:id/sections/:section', legalCaseController.updateSection);
router.post('/:id/sections/:section/complete', legalCaseController.completeSection);
router.post('/:id/decide', legalCaseController.decide);

// Standard CRUD
router.get('/', legalCaseController.listLegalCases);
router.get('/:id', legalCaseController.getLegalCaseById);
router.put('/:id', legalCaseController.updateLegalCase);

module.exports = router;
