const express = require('express');
const router = express.Router();
const ProductController = require('../controller/productController');
const authMiddleware = require('../backend-middleware/authMiddleware');

router.post("/addunit", ProductController.addProductUnit); 
router.post("/sell", ProductController.sellProductUnit);
router.get("/unit", ProductController.getProductUnitWithSerialNumber);
module.exports = router; 