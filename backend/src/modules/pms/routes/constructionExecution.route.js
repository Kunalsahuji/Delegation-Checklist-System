const express = require('express');
const router = express.Router();
const constructionExecutionController = require('../controllers/constructionExecution.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/kpis', (req, res, next) => constructionExecutionController.getKPIs(req, res, next));
router.get('/', (req, res, next) => constructionExecutionController.listRecords(req, res, next));
router.post('/from-project', (req, res, next) => constructionExecutionController.createFromProject(req, res, next));
router.get('/:id', (req, res, next) => constructionExecutionController.getRecordById(req, res, next));
router.put('/:id/section/:sectionKey', (req, res, next) => constructionExecutionController.updateSection(req, res, next));
router.post('/:id/section/:sectionKey/complete', (req, res, next) => constructionExecutionController.completeSection(req, res, next));
router.post('/:id/request-approval', (req, res, next) => constructionExecutionController.requestApproval(req, res, next));
router.post('/:id/decide-approval', (req, res, next) => constructionExecutionController.decideApproval(req, res, next));

module.exports = router;
