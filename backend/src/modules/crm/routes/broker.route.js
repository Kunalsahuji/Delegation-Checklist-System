const express = require('express');
const router = express.Router();
const brokerController = require('../controllers/broker.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI Stats & Network Hierarchy
router.get('/kpis', brokerController.getKPIs);
router.get('/network', brokerController.getNetwork);

// Brokers CRUD
router.get('/', brokerController.listBrokers);
router.post('/', brokerController.createBroker);
router.get('/:id', brokerController.getBrokerById);
router.patch('/:id', brokerController.updateBroker);
router.delete('/:id', brokerController.deleteBroker);

module.exports = router;
