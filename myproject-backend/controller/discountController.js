const DiscountError = require("../errors/discountError");
const Discount = require("../models/discount");
const DiscountService = require("../service/discountService");

exports.createDiscount = async (req, res) => {
  const reqBody = req.body;
  if (!req.body) {
    return res
      .status(400)
      .json({ status: "error", message: "Discount body is missing!" });
  }

  const requiredFields = [
    "discountName",
    "discountRate",
    "organizationId",
    "discountStart",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: "error",
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  try {
    const discount = await DiscountService.createDiscount(reqBody);
    return res.status(201).json({
      status: 'success',
      message: "Discount created successfully",
      data: discount
  });
  } catch (err) {
    console.error("Discount Controller Error:", err);

    if (err instanceof DiscountError) {
      return res.status(err.statusCode).json({
        status: "error",
        type: err.type,
        message: err.message,
      });
    }

    return res.status(500).json({
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
  }
};

exports.getDiscounts = async (req, res) => {
  const { organizationId } = req.query;
  if (!organizationId) {
    return res.status(400).json({
      status: "error",
      message: "Organization ID is required",
    });
  }

  try {
    const discounts = await DiscountService.getDiscounts(organizationId);
    return res.status(200).json({
      status: "success",
      message: "Discount successfully retrieved",
      discounts: discounts,
    });
  } catch (err) {
    console.error("Get Taxes Error:", err);

    if (err instanceof Discount) {
      return res.status(err.statusCode).json({
        status: "error",
        type: err.type,
        message: err.message,
      });
    }

    return res.status(500).json({
      status: "error",
      message: `Failed to retrieve discounts: ${err.message}`,
    });
  }
};

exports.updateDiscount = async (req, res) => {
    const discountId = req.params.discountId; 
    const updates = req.body;  

    try{
        if (!discountId) {
            return res.status(400).json({
                status: 'error',
                message: 'Discount ID is required'
            });
        }
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No update fields provided'
            });
        }
        const allowedUpdates = ['discount_name', 'discount_rate', 'description', 'discount_status', 'discount_start', 'discount_end'];
        const updatesKeys = Object.keys(updates);
        const isValidOperation = updatesKeys.every(key => allowedUpdates.includes(key));
        if (!isValidOperation) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid updates. Allowed fields: ${allowedUpdates.join(', ')}`
            });
        }
        const updatedDiscount = await DiscountService.updateDiscount(discountId, updates);

        return res.status(200).json({
            status: 'success',
            message: 'Discount updated successfully',
            data: updatedDiscount
        });
    } catch (err){
        console.error('Update Discount Error:', err);

        if (err instanceof DiscountError) {
            return res.status(err.statusCode).json({
                status: 'error',
                type: err.type,
                message: err.message
            });
        }

        return res.status(500).json({
            status: 'error',
            message: `Failed to update tax: ${err.message}`
        });
    }
}

exports.deleteDiscount = async (req, res) => {
  const {discountId} = req.params;
  try {
    if (!discountId || isNaN(discountId)) {
      return res.status(400).json({
        status: "error",
        message: "Valid discount ID is required",
      });
    }

    const result = await DiscountService.deleteDiscount(Number(discountId));
    return res.status(200).json({
      status: "success",
      message: "Discount deleted successfully",
      data: result,
    });
  } catch (err) {
    console.error("Delete Discount Error:", err);

    if (err instanceof DiscountError) {
      return res.status(err.statusCode).json({
        status: "error",
        type: err.type,
        message: err.message,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to delete discount",
      //error: err.message,
    });
  }
};