const express = require('express');
const router = express.Router();
const UserController = require('../controller/userController');
const authMiddleware = require('../backend-middleware/authMiddleware');
const InventoryAnalyticsService = require('../service/inventoryAnalyticsService');

//add here, and then construct the controller and service method, service is 
//data access layer, while controller is the presentation layer
router.get('/:username/stock-report', authMiddleware, UserController.getStockReport);
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);

router.get('/:username/salesOrders', UserController.getSalesOrder);

router.get("/inventory/count", UserController.getInventoryCount);
router.post('/:username/addInventory', UserController.addInventory);
router.get('/:username/inventories', UserController.getAllInventory);
router.put('/:username/:inventoryuuid/editInventory', UserController.updateInventory);
router.put('/:username/:inventoryuuid/delete', UserController.deleteInventory);
router.get("/:username/:inventoryuuid", UserController.getInventory);
router.post('/inventory/batch', authMiddleware, UserController.addInventoryBatch);


router.get('/current', authMiddleware, UserController.getCurrentUser);
router.post('/refresh-token', UserController.refreshToken);

//router.post('/:username/registerOrganization', UserController.registerOrganization);
console.log('UserRoutes loaded successfully');
module.exports = router;