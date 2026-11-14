const express = require('express');
const masterCtrl = require('../controllers/master.controller');
const auth = require('../../../middlewares/auth.middleware');
const rbac = require('../../../middlewares/rbac.middleware');

const router = express.Router();
router.use(auth);

router.get('/departments', masterCtrl.getDepartments);
router.post('/departments', rbac(), masterCtrl.createDepartment);

router.get('/projects', masterCtrl.getProjects);
router.post('/projects', rbac(), masterCtrl.createProject);

router.get('/users', masterCtrl.getUsers);

module.exports = router;
