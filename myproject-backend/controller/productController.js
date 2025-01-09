const ProductService = require("../service/productService");
const UserService = require("../service/userService");
const {
  UserNotFoundException,
  PurchaseOrderNotFoundException,
  ProductNotFoundException,
  NotFoundException,
  ProductUnitNotFoundException,
} = require("../errors/notFoundException");
const { ValidationException } = require("../errors/validationError");
const { DatabaseOperationException } = require("../errors/operationError");


exports.addProductUnit = async (req, res) => {
  const { products, purchaseOrderId, username } = req.body;

  try {
    if (!products || !purchaseOrderId || !username) {
      throw new ValidationException("Missing required fields");
    }
    await ProductService.addProductUnit(purchaseOrderId, products, username);

    return res.status(201).json({
      success: true,
      message: "Product units successfully added",
    });
  } catch (err) {
    if (err instanceof UserNotFoundException) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }

    if (err instanceof ValidationException) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }

    if (err instanceof DatabaseOperationException) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        details:
          process.env.NODE_ENV === "development" ? err.details : undefined,
      });
    }
  }
};

exports.getProductUnitWithWarrantyUnit = async (req, res) => {
  const { serialNumber, productId } = req.query;

  try {
    if (!serialNumber) {
    throw new ValidationException("Missing serial number");
    }
    productWithWarranty = await ProductService.getProductUnitWithWarrantyUnit(serialNumber, productId); 
    res.status(200).json({
      data: productWithWarranty, 
      message: "Product unit with warranty information retrieved successfully."
    });
  } catch (err) {
    if (err instanceof ValidationException) {
      return res.status(err.statusCode).json({
        succecss: false,
        error: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}


exports.addExistingUnit = async (req, res) => {
  const { serialNumbers, productId, username } = req.body;

  try {
    if (!serialNumbers || !productId) {
      throw new ValidationException("Missing required fields");
    }
    const user = await UserService.getUserByUsernameAsync(username);
    if (!user) {
      throw new UserNotFoundException(username);
    }
    await ProductService.addExistingUnit(serialNumbers, productId);

    return res.status(201).json({
      success: true,
      message: "Product units successfully added",
    });
  } catch (err) {
    if (err instanceof ValidationException) {
      return res.status(err.statusCode).json({
        succecss: false,
        error: err.message,
      });
    }
    if (err instanceof UserNotFoundException) {
      return res.status(err.statusCode).json({
        succecss: false,
        error: err.message,
      });
    }
    if (err instanceof ProductNotFoundException) {
      return res.status(err.statusCode).json({
        succecss: false,
        error: err.message,
      });
    }
    if (err instanceof DatabaseOperationException) {
      return res.status(err.statusCode).json({
        succecss: false,
        error: err.message,
      });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.sellProductUnit = async (req, res) => {
  const { products, salesOrderId, username } = req.body;

  if (!products || !salesOrderId || !username) {
    throw new ValidationException("Missing required fields");
  }

  const user = await UserService.getUserByUsernameAsync(username);
  if (!user) {
    throw new UserNotFoundException(username);
  }

  await ProductService.sellProductUnit(salesOrderId, products, username);
};
exports.getProductUnit = async (req, res) => {
  const { purchaseOrderId, productId, username } = req.query;

  try {
    if (!purchaseOrderId || !productId || !username) {
      throw new ValidationException(
        "Missing required fields: purchaseOrderId, productId, and username are required"
      );
      throw new UserNotFoundException(username);
    }

    const productUnit = await ProductService.getProductUnit(
      purchaseOrderId,
      productId
    );

    return res.status(200).json({
      message: "Product unit retrieved successfully",
      data: productUnit,
    });
  } catch (err) {
    console.error("Error in getProductUnit endpoint:", {
      error: err.message,
      stack: err.stack,
      params: { purchaseOrderId, productId, username },
    });

    if (
      err instanceof ValidationException ||
      err instanceof UserNotFoundException
    ) {
      return res.status(err.status).json({
        success: false,
        error: {
          type: err.name,
          message: err.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        type: "UnexpectedError",
        message: "An unexpected error occurred",
      },
    });
  }
};

exports.getProductUnitWithSerialNumber = async (req, res) => {
  try {
    const { serialNumber } = req.query;

    if (!serialNumber) {
      throw new ValidationException("Serial number cannot be empty");
    }

    const productUnit = await ProductService.getProductUnitWithSerialNumber(
      serialNumber
    );

    return res.status(200).json({
      success: true,
      message: "Product Unit exists and is not sold yet",
      data: productUnit,
    });
  } catch (err) {
    if (err instanceof ProductUnitNotFoundException) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }
    if (err instanceof ValidationException) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getProductUnitsWithProductId = async (req, res) => {
  const {username, productUuid} = req.params; 
  const {pageNumber, pageSize, searchTerm} = req.query; 
  
  try{
    if(!username || !productUuid) {
      throw ValidationException("ProductUuid and username cannot be empty.");
    }
    const user = await UserService.getUserByUsernameAsync(username);
    if(!user){
      throw UserNotFoundException(username);
    }
    const productUnits = await ProductService.getProductUnitsWithProductId(productUuid, pageNumber, pageSize, searchTerm);
    return res.status(200).json({
      success: true,
      message: "Product units data retrieved successfully",
      data: productUnits,
    });
  } catch (err) {
    if(err instanceof ValidationException) {
      return res.stack(err.statusCode).json({
        succecss: false,
      })
    }
    if(err instanceof ProductNotFoundException) {
      return res.stack(err.statusCode).json({
        succecss: false,
      })
    }
    if(err instanceof UserNotFoundException) {
      return res.stack(err.statusCode).json({
        succecss: false,
      })
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }

};

exports.getExpiringProducts = async (req, res) => {
    try {
        console.log('Fetching expiring products...');
        const expiringProducts = await ProductService.getExpiringProducts();
        console.log('Raw expiring products:', expiringProducts);
        
        // Format the response data
        const formattedProducts = expiringProducts.map(product => {
            const daysUntilExpiry = Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            
            const formatted = {
                id: product.product_id,
                name: product.product_name,
                stock: product.product_stock,
                expiryDate: product.expiry_date,
                daysUntilExpiry,
                sku: product.sku_number,
                brand: product.brand,
                urgency: daysUntilExpiry <= 30 ? 'high' : 'medium'
            };
            console.log('Formatted product:', formatted);
            return formatted;
        });

        console.log('Sending formatted products:', formattedProducts.length);
        res.json(formattedProducts);
    } catch (error) {
        console.error('Error fetching expiring products:', error);
        res.status(500).json({ 
            error: 'Failed to fetch expiring products',
            details: error.message 
        });
    }
};
