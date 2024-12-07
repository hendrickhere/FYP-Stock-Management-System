const express = require('express');
const router = express.Router();
const ProductController = require('../controller/productController');
const authMiddleware = require('../backend-middleware/authMiddleware');

router.post("/addunit", ProductController.addProductUnit); 

module.exports = router; 