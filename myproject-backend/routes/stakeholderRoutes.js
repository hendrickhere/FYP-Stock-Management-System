const express = require('express');
const router = express.Router();
const StakeholderController = require('../controller/stakeholderController');

router.get('/vendors', StakeholderController.getVendors);
router.post('/vendors', StakeholderController.uploadVendors);

module.exports = router;