const express = require('express');
const router = express.Router();
const preSiteStartController = require('../controllers/preSiteStart.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPIs
router.get('/kpis', (req, res, next) => preSiteStartController.getKPIs(req, res, next));

// List
router.get('/', (req, res, next) => preSiteStartController.listRecords(req, res, next));

// Single Detail
router.get('/:id', (req, res, next) => preSiteStartController.getRecordById(req, res, next));

// Hand-off from Project
router.post('/from-project', (req, res, next) => preSiteStartController.createFromProject(req, res, next));

// Section Updates
router.put('/:id/sections/:section', (req, res, next) => preSiteStartController.updateSection(req, res, next));

// Mark Section Completed
router.post('/:id/sections/:section/complete', (req, res, next) => preSiteStartController.completeSection(req, res, next));

// Approval Workflow
router.post('/:id/request-approval', (req, res, next) => preSiteStartController.requestApproval(req, res, next));
router.post('/:id/decide', (req, res, next) => preSiteStartController.decideApproval(req, res, next));

module.exports = router;
