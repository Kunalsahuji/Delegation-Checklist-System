const express = require('express');
const auth = require('../../../middlewares/auth.middleware');
const rbac = require('../../../middlewares/rbac.middleware');
const validate = require('../../../middlewares/validate.middleware');
const taskCtrl = require('../controllers/checklistTask.controller');
const occCtrl = require('../controllers/checklistOccurrence.controller');
const reportCtrl = require('../controllers/checklistReport.controller');
const v = require('../validators/checklist.validator');

const router = express.Router();
router.use(auth);

// Weekly Performance Report endpoints
router.get('/report/weekly', rbac('checklist:read'), reportCtrl.getWeeklyReport);
router.post('/report/weekly/plan', rbac('checklist:update'), reportCtrl.saveWeeklyPlan);

// Task definition endpoints
router.get('/tasks', rbac('checklist:read'), taskCtrl.list);
router.post('/tasks/preview', rbac('checklist:create'), validate(v.preview), taskCtrl.preview);
router.post('/tasks', rbac('checklist:create'), validate(v.createTask), taskCtrl.create);
router.get('/tasks/:id', rbac('checklist:read'), taskCtrl.getOne);
router.post('/tasks/:id/comment', rbac('checklist:read'), taskCtrl.addComment);
router.post('/tasks/:id/attachment', rbac('checklist:read'), taskCtrl.addAttachment);
router.patch('/tasks/:id', rbac('checklist:update'), validate(v.updateTask), taskCtrl.update);
router.patch('/tasks/:id/active', rbac('checklist:update'), taskCtrl.toggleActive);
router.delete('/tasks/:id', rbac('checklist:delete'), taskCtrl.remove);

// Occurrence ticking & operational endpoints
router.get('/occurrences', rbac('checklist:read'), validate(v.listOccurrences), occCtrl.list);
router.get('/occurrences/stats', rbac('checklist:read'), occCtrl.stats);
router.patch('/occurrences/:id/status', rbac('checklist:read'), validate(v.setStatus), occCtrl.setStatus);
router.post('/occurrences/:id/progress', rbac('checklist:read'), validate(v.progressRemark), occCtrl.reportProgress);
router.post('/occurrences/:id/reassign', rbac('checklist:update'), validate(v.reassign), occCtrl.reassign);

module.exports = router;
