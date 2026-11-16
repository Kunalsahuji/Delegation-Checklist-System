const express = require('express');
const projectRoutes = require('./project.route');
const enquiryRoutes = require('./enquiry.route');

const router = express.Router();

// Mount Project & Inventory Routes
router.use('/projects', projectRoutes);

// Mount Enquiry Intake & Qualification Routes
router.use('/enquiries', enquiryRoutes);

module.exports = router;
