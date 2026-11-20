const express = require('express');
const router = express.Router();
const projectPlanningController = require('../controllers/projectPlanning.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// Overview KPIs
router.get('/kpis', projectPlanningController.getKPIs);

// Interlink handoff from Project
router.post('/from-project', projectPlanningController.createFromProject);

// Workflow actions
router.put('/:id/sections/:section', projectPlanningController.updateSection);
router.post('/:id/sections/:section/complete', projectPlanningController.completeSection);
router.post('/:id/request-approval', projectPlanningController.requestApproval);
router.post('/:id/decide', projectPlanningController.decideApproval);

// Standard CRUD
router.get('/', projectPlanningController.listPlans);
router.get('/:id', projectPlanningController.getPlanById);

module.exports = router;
