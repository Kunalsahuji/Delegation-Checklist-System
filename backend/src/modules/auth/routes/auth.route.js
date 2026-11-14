const express = require('express');
const authCtrl = require('../controllers/auth.controller');
const auth = require('../../../middlewares/auth.middleware');
const validate = require('../../../middlewares/validate.middleware');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validate(authValidator.login), authCtrl.login);
router.get('/me', auth, authCtrl.getMe);
router.post('/logout', auth, authCtrl.logout);

module.exports = router;
