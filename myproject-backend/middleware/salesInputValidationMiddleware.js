const { ValidationException } = require('../errors/validationError');
const { SalesError } = require('../errors/salesError');

const salesValidationMiddleware = {
    validateGetAllSalesOrders: (req, res, next) => {
        try {
            const { username } = req.params;
            const { pageNumber, pageSize, searchConfig } = req.query;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Username is required'
                });
            }

            if (pageNumber && (!Number.isInteger(Number(pageNumber)) || Number(pageNumber) < 1)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Page number must be a positive integer'
                });
            }

            if (pageSize && (!Number.isInteger(Number(pageSize)) || Number(pageSize) < 1)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Page size must be a positive integer'
                });
            }

            if (searchConfig) {
                try {
                    const parsedConfig = JSON.parse(searchConfig);
                    const validFilters = [
                        'orderId', 'orderDate', 'shipmentDate', 'totalPrice',
                        'deliveryMethod', 'paymentTerms', 'status', 'customerName'
                    ];

                    if (parsedConfig.activeFilters) {
                        const invalidFilters = parsedConfig.activeFilters.filter(
                            filter => !validFilters.includes(filter)
                        );
                        if (invalidFilters.length > 0) {
                            return res.status(400).json({
                                success: false,
                                error: 'VALIDATION_ERROR',
                                message: `Invalid filters: ${invalidFilters.join(', ')}`
                            });
                        }
                    }
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: 'Invalid searchConfig format'
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Validation error:', error);
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Validation failed'
            });
        }
    },

    validateTimeRange: (req, res, next) => {
        try {
            const { username } = req.params;
            const { range } = req.query;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Username is required'
                });
            }

            if (!range) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Time range is required'
                });
            }

            const parsedRange = parseInt(range);
            if (isNaN(parsedRange) || parsedRange <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Time range must be a positive number'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Time range validation failed'
            });
        }
    },

    validateCreateSalesOrder: (req, res, next) => {
        try {
            const { username } = req.params;
            const salesData = req.body;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Username is required'
                });
            }

            const requiredFields = ['customerUUID', 'paymentTerms'];
            const missingFields = requiredFields.filter(field => !salesData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            if (!Array.isArray(salesData.itemsList) || salesData.itemsList.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Sales order must contain at least one item'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Sales order validation failed'
            });
        }
    },
    
    validateSalesOrderRequest: (req, res, next) => {
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
    },
    validateDeleteSalesOrder: (req, res, next) => {
        try {
            const { username, salesOrderUUID } = req.params;
            const { managerPassword } = req.body;

            if (!username || !salesOrderUUID) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Username and salesOrderUUID are required'
                });
            }

            if (!managerPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Manager password is required for deletion'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Delete validation failed'
            });
        }
    },

    validateUpdateSalesOrder: (req, res, next) => {
        try {
            const { username, salesOrderUUID } = req.params;
            const { updatedData, managerPassword } = req.body;

            if (!username || !salesOrderUUID) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Username and salesOrderUUID are required'
                });
            }

            if (!managerPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Manager password is required for updates'
                });
            }

            if (!updatedData || typeof updatedData !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Updated data is required and must be an object'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Update validation failed'
            });
        }
    },

    validateFastMovingItems: (req, res, next) => {
        try {
            const { username } = req.query;
            const timeRange = parseInt(req.query.timeRange);
            const limit = parseInt(req.query.limit);

            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Username is required'
                });
            }

            if (timeRange && (isNaN(timeRange) || timeRange <= 0 || timeRange > 365)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Time range must be between 1 and 365 days'
                });
            }

            if (limit && (isNaN(limit) || limit <= 0 || limit > 100)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Limit must be between 1 and 100'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Analytics validation failed'
            });
        }
    }
};

module.exports = salesValidationMiddleware;