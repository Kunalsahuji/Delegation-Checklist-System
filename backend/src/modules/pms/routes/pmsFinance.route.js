const express = require('express');
const router = express.Router();
const pmsFinanceController = require('../controllers/pmsFinance.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/kpis', (req, res, next) => pmsFinanceController.getKPIs(req, res, next));
router.get('/', (req, res, next) => pmsFinanceController.listRecords(req, res, next));
router.post('/from-project', (req, res, next) => pmsFinanceController.createFromProject(req, res, next));
router.get('/:id', (req, res, next) => pmsFinanceController.getRecordById(req, res, next));
router.put('/:id/section/:sectionKey', (req, res, next) => pmsFinanceController.updateSection(req, res, next));
router.post('/:id/section/:sectionKey/complete', (req, res, next) => pmsFinanceController.completeSection(req, res, next));
router.post('/:id/request-approval', (req, res, next) => pmsFinanceController.requestApproval(req, res, next));
router.post('/:id/decide-approval', (req, res, next) => pmsFinanceController.decideApproval(req, res, next));

module.exports = router;
