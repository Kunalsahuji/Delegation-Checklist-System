const express = require('express');
const router = express.Router();
const projectControlController = require('../controllers/projectControl.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/kpis', (req, res, next) => projectControlController.getKPIs(req, res, next));
router.get('/', (req, res, next) => projectControlController.listRecords(req, res, next));
router.post('/from-project', (req, res, next) => projectControlController.createFromProject(req, res, next));
router.get('/:id', (req, res, next) => projectControlController.getRecordById(req, res, next));
router.put('/:id/section/:sectionKey', (req, res, next) => projectControlController.updateSection(req, res, next));
router.post('/:id/section/:sectionKey/complete', (req, res, next) => projectControlController.completeSection(req, res, next));
router.post('/:id/request-approval', (req, res, next) => projectControlController.requestApproval(req, res, next));
router.post('/:id/decide-approval', (req, res, next) => projectControlController.decideApproval(req, res, next));

module.exports = router;
