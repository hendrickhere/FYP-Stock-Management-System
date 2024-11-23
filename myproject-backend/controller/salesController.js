const SalesService = require('../service/salesService');
const SalesError = require("../errors/salesError");
exports.getAllSalesOrders = async (req, res) => {
    try {
        console.log('Received request params:', req.params);
        console.log('Username from params:', req.params.username);
        const username = req.params.username;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const salesOrders = await SalesService.getAllSalesOrders(username);
        
        if (!salesOrders) {
            return res.status(404).json({ message: 'No sales orders found' });
        }
        
        res.status(200).json({ salesOrders: salesOrders }); 
    } catch (err) {
        console.error('Error in getAllSalesOrders:', err);
        res.status(500).json({ message: err.message }); // Changed from 404 to 500 for server errors
    }
};

exports.getSalesOrderTotal = async (req, res) => {
    try {
        const username = req.params.username; // Changed from req.body to req.params
        const salesOrderUUID = req.params.salesOrderUUID; // Changed from res.params to req.params
        
        if (!username || !salesOrderUUID) {
            return res.status(400).json({ message: 'Username and salesOrderUUID are required' });
        }

        const total = await SalesService.getSalesOrderTotal(username, salesOrderUUID); // Added await
        res.status(200).json({ total: total }); // Changed from send to json
    } catch (err) {
        console.error('Error getting sales order total:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.createSalesOrder = async (req, res) => {
    try {
        const username = req.params.username;
        const salesData = req.body;

        console.log('Received sales order data:', salesData);
        
        const result = await SalesService.createSalesOrder(username, salesData);
        
        res.status(201).json({
            success: true,
            message: 'Sales order created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating sales order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create sales order'
        });
    }
};

exports.getAvailableProducts = async (req, res) => {
  try {
    const username = req.query.username;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const result = await SalesService.getAvailableProducts(username);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch available products'
    });
  }
};

exports.updateSalesOrder = async (req, res) => {
  try {
    const { username, salesOrderUUID } = req.params;
    const { updatedData, managerPassword } = req.body;

    if (!username || !salesOrderUUID) {
      return res.status(400).json({
        success: false,
        message: 'Username and salesOrderUUID are required'
      });
    }

    if (!updatedData) {
      return res.status(400).json({
        success: false,
        message: 'Updated data is required'
      });
    }

    const result = await SalesService.updateSalesOrder(
      username,
      salesOrderUUID,
      updatedData,
      managerPassword
    );

    res.status(200).json({
      success: true,
      message: 'Sales order updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update sales order'
    });
  }
};

exports.deleteSalesOrder = async (req, res) => {
  try {
    const { username, salesOrderUUID } = req.params;
    const { managerPassword } = req.body;
    
    console.log('Delete request received:', {
      username,
      salesOrderUUID,
      hasPassword: !!managerPassword
    });

    if (!username || !salesOrderUUID) {
      return res.status(400).json({
        success: false,
        message: 'Username and salesOrderUUID are required'
      });
    }

    if (!managerPassword) {
      return res.status(400).json({
        success: false,
        message: 'Manager password is required'
      });
    }

    const result = await SalesService.deleteSalesOrder(username, salesOrderUUID, managerPassword);
    
    res.status(200).json({
      success: true,
      message: 'Sales order deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteSalesOrder controller:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete sales order'
    });
  }
};

exports.validateSalesOrderRequest = (req, res, next) => {
    const { itemLists, taxIds, discountIds } = req.body;

    try {
        if (!itemLists || !Array.isArray(itemLists) || itemLists.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Item list cannot be empty'
            });
        }

        const invalidItems = itemLists.filter(
            item => !item.product_id || 
                   !Number.isInteger(item.quantity) || 
                   item.quantity <= 0
        );

        if (invalidItems.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid items in the item list',
                invalidItems: invalidItems
            });
        }

        if (taxIds !== undefined) {
            if (!Array.isArray(taxIds)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Tax IDs must be an array'
                });
            }

            const invalidTaxIds = taxIds.filter(
                id => !Number.isInteger(Number(id)) || Number(id) <= 0
            );

            if (invalidTaxIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid tax IDs provided',
                    invalidTaxIds: invalidTaxIds
                });
            }
        }

        if (discountIds !== undefined) {
            if (!Array.isArray(discountIds)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Discount IDs must be an array'
                });
            }

            const invalidDiscountIds = discountIds.filter(
                id => !Number.isInteger(Number(id)) || Number(id) <= 0
            );

            if (invalidDiscountIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid discount IDs provided',
                    invalidDiscountIds: invalidDiscountIds
                });
            }
        }

        next();
    } catch (err) {
        logger.error('Validation error:', {
            error: err,
            body: req.body
        });

        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed'
        });
    }
};

// Example of a valid request body:
/*
{
    "itemLists": [
        { "product_id": 1, "quantity": 2 },
        { "product_id": 2, "quantity": 1 }
    ],
    "taxIds": [1, 2, 3],        // Optional array of tax IDs
    "discountIds": [1, 2]       // Optional array of discount IDs
}
*/

exports.calculateSalesOrderTotal = async (req, res) => {
    try {
        const reqBody = req.body;
        if (!reqBody || Object.keys(reqBody).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Request body cannot be empty'
            });
        }

        const { itemLists } = reqBody;
        if (!itemLists || !Array.isArray(itemLists) || itemLists.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Item list must be a non-empty array'
            });
        }

        const total = await SalesService.calculateSalesOrderTotal(reqBody);

        if (typeof total !== 'object' || total.grandtotal <= 0) {
            return res.status(422).json({
                success: false,
                error: 'PROCESSING_ERROR',
                message: 'Invalid total calculated'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Total calculated successfully',
            data: total
        });

    } catch (err) {
        if (err instanceof SalesError) {
            return res.status(err.statusCode || 400).json({
                success: false,
                error: err.code,
                message: err.message
            });
        }

        if (err.name === 'SequelizeError' || err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: 'DATABASE_ERROR',
                message: 'Invalid data provided'
            });
        }
        return res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred while processing your request',
            ...(process.env.NODE_ENV === 'development' && { detail: err.message })
        });
    }
};