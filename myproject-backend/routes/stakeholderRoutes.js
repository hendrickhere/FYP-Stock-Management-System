const express = require('express');
const router = express.Router();
const StakeholderController = require('../controller/stakeholderController');

router.get('/vendors', StakeholderController.getVendors);
router.post('/vendors', StakeholderController.uploadVendors);
router.put('/vendors/:vendor_id', StakeholderController.updateVendor);
router.delete('/vendors/:vendor_id', StakeholderController.deleteVendor);

router.post('/addCustomer', StakeholderController.addCustomer);
router.get('/customers', StakeholderController.getAllCustomers);
router.get('/customer/:uuid', StakeholderController.getCustomer);
router.put('/customers/:uuid', StakeholderController.updateCustomer);
router.delete('/customer/:uuid', StakeholderController.deleteCustomer);

router.get('/staffs', StakeholderController.getStaffs);
module.exports = router;