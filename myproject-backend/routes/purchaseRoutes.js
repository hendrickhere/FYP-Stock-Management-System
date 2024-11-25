const express = require('express');
const router = express.Router();
const purchaseController = require('../controller/purchaseController');
const authMiddleware = require('../backend-middleware/authMiddleware');

// Get purchases with pagination
router.get('/:username', authMiddleware, purchaseController.getAllPurchase);

// Create new purchase order
router.post('/add', authMiddleware, purchaseController.insertPurchase);

// Create delivered purchase order (auto-updates inventory)
router.post('/add-delivered', authMiddleware, purchaseController.insertDeliveredPurchase);

// Add this new route for updating purchase orders
router.put('/user/:username/:purchaseOrderId', authMiddleware, purchaseController.updatePurchaseOrder);

// Update purchase order status
router.put('/:purchaseOrderId/status', authMiddleware, purchaseController.updatePurchaseStatus);

// Get purchase order details
router.get('/:purchaseOrderId/details', authMiddleware, purchaseController.getPurchaseDetails);

router.delete('/user/:username/:purchaseOrderId', authMiddleware, purchaseController.deletePurchaseOrder);

module.exports = router;