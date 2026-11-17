const express = require('express');
const router = express.Router();
const visitReportController = require('../controllers/visitReport.controller');
const { auth } = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI Stats
router.get('/stats', visitReportController.getStats);

// Visits list and CRUD
router.get('/', visitReportController.listVisits);
router.post('/', visitReportController.createVisit);
router.get('/:id', visitReportController.getVisitById);
router.patch('/:id', visitReportController.updateVisit);
router.delete('/:id', visitReportController.deleteVisit);

module.exports = router;
