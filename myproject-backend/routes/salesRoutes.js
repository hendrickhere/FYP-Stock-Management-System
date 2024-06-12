const express = require('express');
const router = express.Router();
const SalesController = require('../controller/salesController');

router.get('/:salesOrderUUID/total', SalesController.getSalesOrderTotal);

module.exports = router;