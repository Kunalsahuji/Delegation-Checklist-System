const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { auth } = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/activities', calendarController.getActivities);

module.exports = router;
