const express = require('express');
const router = express.Router();
const landPurchaseController = require('../controllers/landPurchase.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// Overview KPIs
router.get('/kpis', landPurchaseController.getKPIs);

// Interlink handoff from Plot / Legal Case
router.post('/from-plot', landPurchaseController.createFromPlot);

// Workflow actions
router.put('/:id/sections/:section', landPurchaseController.updateSection);
router.post('/:id/sections/:section/complete', landPurchaseController.completeSection);
router.post('/:id/request-approval', landPurchaseController.requestApproval);
router.post('/:id/decide-price', landPurchaseController.decidePrice);
router.post('/:id/complete', landPurchaseController.completePurchase);

// Standard CRUD
router.get('/', landPurchaseController.listPurchases);
router.get('/:id', landPurchaseController.getPurchaseById);

module.exports = router;
