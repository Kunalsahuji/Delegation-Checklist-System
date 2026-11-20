const express = require('express');
const router = express.Router();
const procurementInventoryController = require('../controllers/procurementInventory.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPIs
router.get('/kpis', (req, res, next) => procurementInventoryController.getKPIs(req, res, next));

// List
router.get('/', (req, res, next) => procurementInventoryController.listRecords(req, res, next));

// Single Detail
router.get('/:id', (req, res, next) => procurementInventoryController.getRecordById(req, res, next));

// Hand-off from Project
router.post('/from-project', (req, res, next) => procurementInventoryController.createFromProject(req, res, next));

// Section Updates
router.put('/:id/sections/:section', (req, res, next) => procurementInventoryController.updateSection(req, res, next));

// Mark Section Completed
router.post('/:id/sections/:section/complete', (req, res, next) => procurementInventoryController.completeSection(req, res, next));

// Approval Workflow
router.post('/:id/request-approval', (req, res, next) => procurementInventoryController.requestApproval(req, res, next));
router.post('/:id/decide', (req, res, next) => procurementInventoryController.decideApproval(req, res, next));

module.exports = router;
