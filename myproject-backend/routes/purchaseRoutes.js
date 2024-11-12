const express = require('express');
const router = express.Router();
const PurchaseController = require("../controller/purchaseController");


router.get("/:username", PurchaseController.getAllPurchase);
router.post("/add", PurchaseController.insertPurchase);

module.exports = router;