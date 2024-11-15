const express = require('express');
const router = express.Router();
const TaxController = require('../controller/taxController');

router.get("/taxes", TaxController.getTaxes);
router.post("/tax", TaxController.createTax);
router.delete("/tax/:taxId", TaxController.deleteTax);
router.patch("/tax/:taxId", TaxController.updateTax);

module.exports = router;
