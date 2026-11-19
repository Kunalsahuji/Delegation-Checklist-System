const express = require('express');
const router = express.Router();
const plotController = require('../controllers/plot.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.get('/kpis', plotController.getKPIs);
router.post('/:id/transition', plotController.transitionStatus);

router.get('/', plotController.listPlots);
router.post('/', plotController.createPlot);
router.get('/:id', plotController.getPlotById);
router.put('/:id', plotController.updatePlot);
router.delete('/:id', plotController.deletePlot);

module.exports = router;
