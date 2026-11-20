const express = require('express');
const router = express.Router();
const qualityControlController = require('../controllers/qualityControl.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/kpis', (req, res, next) => qualityControlController.getKPIs(req, res, next));
router.get('/', (req, res, next) => qualityControlController.listRecords(req, res, next));
router.post('/from-project', (req, res, next) => qualityControlController.createFromProject(req, res, next));
router.get('/:id', (req, res, next) => qualityControlController.getRecordById(req, res, next));
router.put('/:id/section/:sectionKey', (req, res, next) => qualityControlController.updateSection(req, res, next));
router.post('/:id/section/:sectionKey/complete', (req, res, next) => qualityControlController.completeSection(req, res, next));
router.post('/:id/request-approval', (req, res, next) => qualityControlController.requestApproval(req, res, next));
router.post('/:id/decide-approval', (req, res, next) => qualityControlController.decideApproval(req, res, next));

module.exports = router;
