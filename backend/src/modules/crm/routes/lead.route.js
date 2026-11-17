const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const auth = require('../../../middlewares/auth.middleware');

// Public or protected CRM routes
router.use(auth);

router.get('/stages', leadController.listStages);
router.get('/', leadController.listLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', leadController.createLead);
router.post('/convert-enquiry/:enquiryId', leadController.convertEnquiry);
router.post('/:id/move-stage', leadController.moveStage);
router.post('/:id/undo-stage', leadController.undoStage);
router.post('/:id/mark-won', leadController.markWon);
router.post('/:id/mark-lost', leadController.markLost);
router.post('/:id/mark-dropped', leadController.markDropped);

module.exports = router;
