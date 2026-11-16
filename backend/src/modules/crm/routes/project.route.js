const express = require('express');
const projectCtrl = require('../controllers/project.controller');
const auth = require('../../../middlewares/auth.middleware');

const router = express.Router();

// All CRM Project routes require authentication
router.use(auth);

// Project Collection CRUD
router.get('/', projectCtrl.listProjects);
router.post('/', projectCtrl.createProject);
router.get('/:id', projectCtrl.getProjectById);
router.patch('/:id', projectCtrl.updateProject);
router.delete('/:id', projectCtrl.deleteProject);

// Units / Inventory Sub-routes
router.post('/:id/units', projectCtrl.addUnit);
router.patch('/:id/units/:unitId', projectCtrl.updateUnit);
router.delete('/:id/units/:unitId', projectCtrl.deleteUnit);

module.exports = router;
