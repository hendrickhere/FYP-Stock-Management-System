const express = require('express');
const router = express.Router();
const ProductController = require('../controller/productController');
const authMiddleware = require('../backend-middleware/authMiddleware');

// Existing routes
router.post("/unit/new", ProductController.addProductUnit); 
router.post("/unit/existing", ProductController.addExistingUnit); 
router.get("/unit/warranty", ProductController.getProductUnitWithWarrantyUnit);
router.post("/sell", ProductController.sellProductUnit);
router.get("/unit", ProductController.getProductUnitWithSerialNumber);
router.get("/units/:username/:productUuid", ProductController.getProductUnitsWithProductId);

// New route for expiring products
router.get("/expiring", ProductController.getExpiringProducts);

module.exports = router;