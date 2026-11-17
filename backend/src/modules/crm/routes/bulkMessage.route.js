const express = require('express');
const router = express.Router();
const bulkMessageController = require('../controllers/bulkMessage.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

// KPI Stats
router.get('/kpis', bulkMessageController.getKPIs);

// Templates & Preview
router.get('/templates', bulkMessageController.getTemplates);
router.post('/preview', bulkMessageController.previewAudience);

// Campaigns CRUD
router.get('/', bulkMessageController.listCampaigns);
router.post('/', bulkMessageController.createCampaign);
router.get('/:id', bulkMessageController.getCampaignById);
router.delete('/:id', bulkMessageController.deleteCampaign);

module.exports = router;
