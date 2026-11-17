const express = require('express');
const router = express.Router();
const crmDashboardController = require('../controllers/dashboard.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/', crmDashboardController.getDashboardData);

module.exports = router;
