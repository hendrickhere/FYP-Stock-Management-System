
const express = require('express');
const router = express.Router();
const SalesController = require('../controller/salesController');
const authMiddleware = require('../backend-middleware/authMiddleware');
const SalesValidationMiddleware  = require("../middleware/salesInputValidationMiddleware");

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
router.get('/:username/salesOrders', SalesValidationMiddleware.validateGetAllSalesOrders, SalesController.getAllSalesOrders);
router.get('/:salesOrderUUID/total', SalesController.getSalesOrderTotal);
router.post('/:username/salesOrder', SalesValidationMiddleware.validateCreateSalesOrder, SalesController.createSalesOrder);
router.put('/user/:username/salesOrder/:salesOrderUUID', SalesValidationMiddleware.validateUpdateSalesOrder, SalesController.updateSalesOrder);
router.delete('/user/:username/salesOrder/:salesOrderUUID', SalesValidationMiddleware.validateDeleteSalesOrder, SalesController.deleteSalesOrder);
router.post('/taxAndDiscount', SalesValidationMiddleware.validateSalesOrderRequest, SalesController.calculateSalesOrderTotal);
router.get('/products', SalesController.getAvailableProducts);
router.get('/analytics/fast-moving', SalesController.getFastMovingItems);
router.get('/generate-invoice/:salesOrderUuid', SalesController.generateInvoice)
router.post('/return', SalesController.returnSalesOrder);

module.exports = router;