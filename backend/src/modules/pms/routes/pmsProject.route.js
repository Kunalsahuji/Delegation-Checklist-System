const express = require('express');
const router = express.Router();
const pmsProjectController = require('../controllers/pmsProject.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// Overview KPIs
router.get('/kpis', pmsProjectController.getKPIs);

// Stage rail actions
router.post('/:id/toggle-checklist', pmsProjectController.toggleChecklistItem);
router.post('/:id/advance-stage', pmsProjectController.advanceStage);

// Standard CRUD
router.get('/', pmsProjectController.listProjects);
router.post('/', pmsProjectController.createProject);
router.get('/:id', pmsProjectController.getProjectById);
router.put('/:id', pmsProjectController.updateProject);
router.delete('/:id', pmsProjectController.deleteProject);

module.exports = router;
