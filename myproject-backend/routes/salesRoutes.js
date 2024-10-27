const express = require('express');
const router = express.Router();
const SalesController = require('../controller/salesController');

router.get('/test', (req, res) => {
    res.json({ message: 'Sales route is working' });
});

router.get('/user/:username', SalesController.getAllSalesOrders);
router.get('/:salesOrderUUID/total', SalesController.getSalesOrderTotal);

module.exports = router;