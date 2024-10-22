const express = require('express');
const router = express.Router();
const UserController = require('../controller/userController');
const authMiddleware = require('../backend-middleware/authMiddleware');

//add here, and then construct the controller and service method, service is 
//data access layer, while controller is the presentation layer
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);

router.post('/:username/addCustomer', UserController.addCustomer);
router.get('/:username/customers', UserController.getAllCustomers);
router.get('/:username/customer/:customeruuid', UserController.getCustomer);

router.post('/:username/salesOrder', UserController.addSalesOrder);
router.get('/:username/salesOrders', UserController.getSalesOrder);

router.post('/:username/addInventory', UserController.addInventory);
router.get('/:username/inventories', UserController.getAllInventory);
router.put('/:username/:inventoryuuid/editInventory', UserController.updateInventory);
router.put('/:username/:inventoryuuid/delete', UserController.deleteInventory);
router.get("/:username/:inventoryuuid", UserController.getInventory);


router.get('/current', authMiddleware, UserController.getCurrentUser);









//router.post('/:username/registerOrganization', UserController.registerOrganization);




module.exports = router;