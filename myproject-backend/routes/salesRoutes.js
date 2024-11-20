const express = require('express');
const router = express.Router();
const SalesController = require('../controller/salesController');

router.get('/test', (req, res) => {
    res.json({ message: 'Sales route is working' });
});

router.get('/user/:username', SalesController.getAllSalesOrders);
router.get('/:salesOrderUUID/total', SalesController.getSalesOrderTotal);
router.post('/user/:username/salesOrder', SalesController.createSalesOrder);
router.put('/user/:username/salesOrder/:salesOrderUUID', SalesController.updateSalesOrder);
router.delete('/user/:username/salesOrder/:salesOrderUUID', SalesController.deleteSalesOrder);
router.post('/taxAndDiscount', SalesController.validateSalesOrderRequest, SalesController.calculateSalesOrderTotal)

module.exports = router;