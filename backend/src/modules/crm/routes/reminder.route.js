const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI Stats
router.get('/stats', reminderController.getStats);

// Special Follow-ups
router.get('/special', reminderController.listSpecialFollowups);
router.post('/special/toggle', reminderController.toggleSpecialFollowup);

// Reminders CRUD & Actions
router.get('/', reminderController.listReminders);
router.post('/', reminderController.createReminder);
router.post('/:id/complete', reminderController.completeReminder);
router.post('/:id/reschedule', reminderController.rescheduleReminder);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
