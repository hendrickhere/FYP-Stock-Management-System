const SalesService = require('../service/salesService');
const { SalesError } = require('../errors/salesError.js');
const invoiceGenerator = require('../service/invoiceGenerator');
const Joi = require('joi');
const { ValidationException } = require('../errors/validationError.js');

exports.getAllSalesOrders = async (req, res) => {
    try {
        console.log('Received request params:', req.params);
        console.log('Username from params:', req.params.username);
        const username = req.params.username;
        const pageNumber = req.query.pageNumber; 
        const pageSize = req.query.pageSize; 
        let searchConfig = null;
        if (req.query.searchConfig) {
            try {
                searchConfig = JSON.parse(req.query.searchConfig);
                
                if (searchConfig && typeof searchConfig === 'object') {
                    if (!('term' in searchConfig) || typeof searchConfig.term !== 'string') {
                        searchConfig.term = '';
                    }
                    if (!Array.isArray(searchConfig.activeFilters)) {
                        searchConfig.activeFilters = [];
                    }
                }
            } catch (parseError) {
                console.error('Error parsing searchConfig:', parseError);
                return res.status(400).json({ 
                    message: 'Invalid searchConfig format',
                    error: parseError.message 
                });
            }
        }
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const salesOrders = await SalesService.getAllSalesOrders(username, pageSize, pageNumber, searchConfig);
        
        if (!salesOrders) {
            return res.status(404).json({ message: 'No sales orders found' });
        }
        
        res.status(200).json( salesOrders ); 
    } catch (err) {
        console.error('Error in getAllSalesOrders:', err);
        res.status(500).json({ message: err.message });
    }
};

const returnSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      product_units: Joi.array().items(
        Joi.object({
          serial_number: Joi.string().trim().required(),
          product_unit_id: Joi.number().integer().positive().required()
        })
      ).min(1).required()
    })
  ).min(1).required(),
  date_of_return: Joi.date().iso().required(),
  sales_order_uuid: Joi.string().uuid().required(),
  processed_by: Joi.string().trim().required(),
  reason: Joi.string().trim().min(1).required()
});

exports.returnSalesOrder = async (req, res) => {
  try {
    const validated = await returnSchema.validateAsync(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    const returnRecord = await SalesService.returnSalesOrder(validated);

    return res.status(201).json({
      status: 'success',
      data: returnRecord,
      message: "Product return successfully processed."
    });

  } catch (error) {
    if (error.isJoi) {
      // Validation error
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.details.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Service/Database error
    console.error('Error processing return:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}

exports.getAllSalesOrderWithTimeRange = async (req, res, next) => {
    try {
      const { username } = req.params;
      const { range } = req.query;
  
      const salesOrderTotal = await SalesService.getSalesOrderTotalWithTimeRange(
        username,
        range
      );
  
      return res.status(200).json({
        success: true,
        data: {
          username,
          timeRange: range,
          totalSales: salesOrderTotal
        }   
      });
  
    } catch (error) {
      console.error('Sales controller error:', error);
  
      if (error instanceof SalesError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            type: error.name,
            message: error.message,
            statusCode: error.statusCode
          }
        });
      }
        return res.status(500).json({
        success: false,
        error: {
          type: 'UnexpectedError',
          message: 'An unexpected error occurred',
          statusCode: 500
        }
      });
    }
  };

exports.getSalesOrderTotal = async (req, res) => {
    try {
        const username = req.params.username; 
        const salesOrderUUID = req.params.salesOrderUUID; 
        
        if (!username || !salesOrderUUID) {
            return res.status(400).json({ message: 'Username and salesOrderUUID are required' });
        }

        const total = await SalesService.getSalesOrderTotal(username, salesOrderUUID); 
        res.status(200).json({ total: total }); 
    } catch (err) {
        console.error('Error getting sales order total:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.viewSalesOrderReturn = async (req, res) => {
  try{
    const {organizationId, pageSize, pageNumber} = req.query; 

    if(!organizationId){
      throw new ValidationException("Organization id cannot be null");
    }

    var returns = await SalesService.getSalesOrderReturn(organizationId, pageSize, pageNumber);
    
    res.status(200).json({data: returns, message: "Returns retrieved successfully"});
  } catch (err) {
    if (err instanceof ValidationException){
      res.status(err.statusCode).json({message: err.message});
    }
    res.status(500).json({ message: err.message });
  }
}
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

exports.getFastMovingItems = async (req, res) => {
    try {
        // Get username from query params or auth middleware
        const username = req.query.username || req.user.username;
        
        console.log('Processing analytics request for username:', username);
        
        // Input validation
        const timeRange = parseInt(req.query.timeRange) || 30;
        const sortBy = req.query.sortBy || 'quantity';
        const limit = parseInt(req.query.limit) || 5;
        
        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Username is required'
            });
        }

        // Get analytics with all parameters
        const analyticsResult = await SalesService.getFastMovingItemsAnalytics(
            username,
            {
                timeRange,
                category: req.query.category,
                minSales: parseInt(req.query.minSales) || 0,
                sortBy,
                limit
            }
        );

        return res.status(200).json(analyticsResult);

    } catch (error) {
        // Enhanced error logging
        console.error('Error in getFastMovingItems controller:', {
            error: error.message,
            stack: error.stack,
            username: req.query.username,
            params: req.query
        });

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Failed to get fast-moving items analytics'
        });
    }
};

exports.generateInvoice = async (req, res) => {
  const salesOrderId = req.params.salesOrderUuid;
  try {
    const pdf = await invoiceGenerator.generateInvoice(salesOrderId);
    
    // Ensure proper headers for binary PDF data
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${salesOrderId}.pdf`);
    res.setHeader('Content-Length', Buffer.byteLength(pdf));
    
    // Send as buffer
    res.send(Buffer.from(pdf));

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message });
  }
}