const express = require('express');
const auth = require('../../../middlewares/auth.middleware');
const rbac = require('../../../middlewares/rbac.middleware');
const validate = require('../../../middlewares/validate.middleware');
const ctrl = require('../controllers/delegation.controller');
const reportCtrl = require('../controllers/delegationReport.controller');
const v = require('../validators/delegation.validator');

const router = express.Router();
router.use(auth);

// Weekly Performance Report endpoints
router.get('/report/weekly', rbac('delegation:read'), reportCtrl.getWeeklyReport);
router.post('/report/weekly/plan', rbac('delegation:update'), reportCtrl.saveWeeklyPlan);

router.get('/', rbac('delegation:read'), validate(v.list), ctrl.list);
router.get('/stats', rbac('delegation:read'), ctrl.stats);
router.post('/', rbac('delegation:create'), validate(v.create), ctrl.create);

router.get('/:id', rbac('delegation:read'), ctrl.getOne);
router.delete('/:id', rbac('delegation:delete'), ctrl.remove);
router.post('/:id/comment', rbac('delegation:read'), ctrl.addComment);
router.post('/:id/attachment', rbac('delegation:read'), ctrl.addAttachment);
router.post('/:id/revise', rbac('delegation:revise'), validate(v.revise), ctrl.revise);
router.patch('/:id/status', rbac('delegation:read'), validate(v.setStatus), ctrl.setStatus);
router.post('/:id/progress', rbac('delegation:read'), validate(v.reportProgress), ctrl.reportProgress);
router.post('/:id/reassign', rbac('delegation:update'), validate(v.reassign), ctrl.reassign);
router.post('/:id/follow-up', rbac('delegation:read'), validate(v.followUp), ctrl.followUp);

module.exports = router;
