const express = require('express');
const router = express.Router();
const baselinePlanningController = require('../controllers/baselinePlanning.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPIs
router.get('/kpis', (req, res, next) => baselinePlanningController.getKPIs(req, res, next));

// List
router.get('/', (req, res, next) => baselinePlanningController.listBaselines(req, res, next));

// Single Detail
router.get('/:id', (req, res, next) => baselinePlanningController.getBaselineById(req, res, next));

// Hand-off from Project
router.post('/from-project', (req, res, next) => baselinePlanningController.createFromProject(req, res, next));

// Section Updates
router.put('/:id/sections/:section', (req, res, next) => baselinePlanningController.updateSection(req, res, next));

// Mark Section Completed
router.post('/:id/sections/:section/complete', (req, res, next) => baselinePlanningController.completeSection(req, res, next));

// Baseline Lock Governance Workflow
router.post('/:id/request-lock', (req, res, next) => baselinePlanningController.requestBaselineLock(req, res, next));
router.post('/:id/lock', (req, res, next) => baselinePlanningController.lockBaseline(req, res, next));

module.exports = router;
