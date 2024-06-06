const express = require('express');
const router = express.Router();
const UserController = require('../controller/userController');

//add here, and then construct the controller and service method, service is 
//data access layer, while controller is the presentation layer
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);
router.post('/:username/addCustomer', UserController.addCustomer);
router.get('/:username/customers', UserController.getAllCustomers);
router.get('/:username/customer/:customeruuid', UserController.getCustomer);
router.post('/:username/addInventory', UserController.addInventory);
router.get('/:username/inventories', UserController.getAllInventory);
router.put('/:username/:inventoryuuid/editInventory', UserController.udpateInventory);
router.post('/:username/salesOrder', UserController.addSalesOrder);
//router.post('/:username/salesOrder', UserController.salesOrder);


//router.post('/:username/registerOrganization', UserController.registerOrganization);




module.exports = router;