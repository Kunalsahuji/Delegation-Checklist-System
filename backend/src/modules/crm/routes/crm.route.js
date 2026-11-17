const express = require('express');
const projectRoutes = require('./project.route');
const enquiryRoutes = require('./enquiry.route');
const leadRoutes = require('./lead.route');
const leadAssignmentRoutes = require('./leadAssignment.route');
const visitRoutes = require('./visit.route');
const reminderRoutes = require('./reminder.route');
const calendarRoutes = require('./calendar.route');
const brokerRoutes = require('./broker.route');
const metaLeadRoutes = require('./metaLead.route');
const bulkMessageRoutes = require('./bulkMessage.route');
const dashboardRoutes = require('./dashboard.route');

const router = express.Router();

// Mount Project & Inventory Routes
router.use('/projects', projectRoutes);

// Mount Enquiry Intake & Qualification Routes
router.use('/enquiries', enquiryRoutes);

// Mount Leads Pipeline & Stage Progression Routes
router.use('/leads', leadRoutes);

// Mount Lead Assignment & Distribution Routes
router.use('/lead-assignments', leadAssignmentRoutes);

// Mount Site Visits & Geo-Fencing Routes
router.use('/visits', visitRoutes);

// Mount Reminders & Follow-up Routes
router.use('/reminders', reminderRoutes);

// Mount Unified CRM Calendar Routes
router.use('/calendar', calendarRoutes);

// Mount Channel Partners & Broker Network Routes
router.use('/brokers', brokerRoutes);

// Mount Meta Ad Campaigns & Leads Routes
router.use('/meta-leads', metaLeadRoutes);

// Mount Bulk Message & Campaign Broadcast Routes
router.use('/bulk-messages', bulkMessageRoutes);

// Mount Executive CRM Dashboard Routes
router.use('/dashboard', dashboardRoutes);

module.exports = router;
