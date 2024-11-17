const express = require('express');
const router = express.Router();
const DiscountController = require('../controller/discountController');

router.get("/discounts", DiscountController.getDiscounts);
router.post("/discount", DiscountController.createDiscount);
router.delete("/discount/:discountId", DiscountController.deleteDiscount);
router.patch("/discount/:discountId", DiscountController.updateDiscount);

module.exports = router;
