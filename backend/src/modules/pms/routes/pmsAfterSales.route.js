const express = require('express');
const router = express.Router();
const pmsAfterSalesController = require('../controllers/pmsAfterSales.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI aggregation
router.get('/kpis', (req, res, next) => pmsAfterSalesController.getKPIs(req, res, next));

// List with filters & pagination
router.get('/', (req, res, next) => pmsAfterSalesController.listRecords(req, res, next));

// Initialize / create after-sales record from project
router.post('/from-project', (req, res, next) => pmsAfterSalesController.createFromProject(req, res, next));

// Single record details
router.get('/:id', (req, res, next) => pmsAfterSalesController.getRecordById(req, res, next));

// Update section data (support both /section and /sections)
router.put('/:id/section/:sectionKey', (req, res, next) => pmsAfterSalesController.updateSection(req, res, next));
router.put('/:id/sections/:sectionKey', (req, res, next) => pmsAfterSalesController.updateSection(req, res, next));

// Mark section as completed
router.post('/:id/section/:sectionKey/complete', (req, res, next) => pmsAfterSalesController.completeSection(req, res, next));
router.post('/:id/sections/:sectionKey/complete', (req, res, next) => pmsAfterSalesController.completeSection(req, res, next));

// Request approval
router.post('/:id/request-approval', (req, res, next) => pmsAfterSalesController.requestApproval(req, res, next));

// Decide approval (approve / reject)
router.post('/:id/decide-approval', (req, res, next) => pmsAfterSalesController.decideApproval(req, res, next));

module.exports = router;
