const express = require('express');
const projectRoutes = require('./project.route');

const router = express.Router();

// Mount Project & Inventory Routes
router.use('/projects', projectRoutes);

module.exports = router;
