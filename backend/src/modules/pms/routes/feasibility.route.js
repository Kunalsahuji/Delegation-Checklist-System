const express = require('express');
const router = express.Router();
const feasibilityController = require('../controllers/feasibility.controller');
const auth = require('../../../middlewares/auth.middleware');

router.use(auth);

router.post('/plot/:plotId', feasibilityController.saveFeasibility);
router.post('/:id/decide', feasibilityController.decideFeasibility);

module.exports = router;
