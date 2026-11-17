const express = require('express');
const projectRoutes = require('./project.route');
const enquiryRoutes = require('./enquiry.route');
const leadRoutes = require('./lead.route');
const leadAssignmentRoutes = require('./leadAssignment.route');

const router = express.Router();

// Mount Project & Inventory Routes
router.use('/projects', projectRoutes);

// Mount Enquiry Intake & Qualification Routes
router.use('/enquiries', enquiryRoutes);

// Mount Leads Pipeline & Stage Progression Routes
router.use('/leads', leadRoutes);

// Mount Lead Assignment & Distribution Routes
router.use('/lead-assignments', leadAssignmentRoutes);

module.exports = router;
