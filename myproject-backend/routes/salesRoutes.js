const express = require('express');
const router = express.Router();
const SalesController = require('../controller/salesController');
const authMiddleware = require('../backend-middleware/authMiddleware');

router.use((req, res, next) => {
    console.log('Sales Route accessed:', {
        path: req.path,
        method: req.method,
        auth: req.headers.authorization ? 'Present' : 'Missing'
    });
    next();
});

router.get('/test', (req, res) => {
    res.json({ message: 'Sales route is working' });
});

router.use(authMiddleware);

//router.get('/user/:username', SalesController.getAllSalesOrders);
router.get('/:username/salesOrderTotal', SalesController.getAllSalesOrderWithTimeRange);
router.get('/:username/salesOrders', SalesController.getAllSalesOrders);
router.get('/:salesOrderUUID/total', SalesController.getSalesOrderTotal);
router.post('/:username/salesOrder', SalesController.createSalesOrder);
router.put('/user/:username/salesOrder/:salesOrderUUID', SalesController.updateSalesOrder);
router.delete('/user/:username/salesOrder/:salesOrderUUID', SalesController.deleteSalesOrder);
router.post('/taxAndDiscount', SalesController.validateSalesOrderRequest, SalesController.calculateSalesOrderTotal);
router.get('/products', SalesController.getAvailableProducts);
router.get('/analytics/fast-moving', SalesController.getFastMovingItems);


module.exports = router;