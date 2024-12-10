const express = require('express');
const router = express.Router();
const ProductController = require('../controller/productController');
const authMiddleware = require('../backend-middleware/authMiddleware');

router.post("/unit/new", ProductController.addProductUnit); 
router.post("/unit/existing", ProductController.addExistingUnit); 
router.post("/sell", ProductController.sellProductUnit);
router.get("/unit", ProductController.getProductUnitWithSerialNumber);
module.exports = router; 