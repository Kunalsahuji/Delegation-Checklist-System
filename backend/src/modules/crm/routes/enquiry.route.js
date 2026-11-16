const express = require('express');
const enquiryCtrl = require('../controllers/enquiry.controller');
const auth = require('../../../middlewares/auth.middleware');

const router = express.Router();
router.use(auth);

// Duplicate check
router.get('/check-phone', enquiryCtrl.checkPhone);

// Enquiries CRUD
router.get('/', enquiryCtrl.listEnquiries);
router.post('/', enquiryCtrl.createEnquiry);
router.get('/:id', enquiryCtrl.getEnquiryById);
router.patch('/:id', enquiryCtrl.updateEnquiry);
router.delete('/:id', enquiryCtrl.deleteEnquiry);

// Workflow actions
router.post('/:id/remarks', enquiryCtrl.addRemark);
router.post('/:id/qualify', enquiryCtrl.qualifyEnquiry);
router.post('/:id/reject', enquiryCtrl.rejectEnquiry);
router.post('/:id/special-followup', enquiryCtrl.toggleSpecialFollowup);

module.exports = router;
