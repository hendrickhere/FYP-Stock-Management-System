const express = require('express');
const router = express.Router();
const StakeholderController = require('../controller/stakeholderController');

router.get('/vendors', StakeholderController.getVendors);
router.post('/vendors', StakeholderController.uploadVendors);

router.post('/addCustomer', StakeholderController.addCustomer);
router.get('/customers', StakeholderController.getAllCustomers);
router.get('/customer/:uuid', StakeholderController.getCustomer);

module.exports = router;