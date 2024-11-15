const TaxService = require("../service/taxService");
const TaxError = require("../errors/taxError");
// TaxController.js
exports.createTax = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                status: 'error',
                message: "Bad request, request body is empty"
            });
        }

        const requiredFields = ['taxName', 'taxRate', 'organizationId'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const tax = await TaxService.createTax(req.body);
        
        return res.status(201).json({
            status: 'success',
            message: "Tax created successfully",
            data: tax
        });

    } catch (err) {
        console.error('Tax Controller Error:', err);

        if (err instanceof TaxError) {
            return res.status(err.statusCode).json({
                status: 'error',
                type: err.type,
                message: err.message
            });
        }

        return res.status(500).json({
            status: 'error',
            type: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        });
    }
};

exports.getTaxes = async (req, res) => {
    const organizationId = req.query.orgId;

    if (!organizationId) {
        return res.status(400).json({
            status: 'error',
            message: 'Organization ID is required'
        });
    }

    try {
        const taxes = await TaxService.getTaxes(organizationId);
        
        return res.status(200).json({
            status: 'success',
            message: 'Taxes retrieved successfully',
            data: taxes
        });

    } catch (err) {
        console.error('Get Taxes Error:', err);
        
        if (err instanceof TaxError) {
            return res.status(err.statusCode).json({
                status: 'error',
                type: err.type,
                message: err.message
            });
        }

        return res.status(500).json({
            status: 'error',
            message: `Failed to retrieve taxes: ${err.message}`
        });
    }
};

exports.updateTax = async (req, res) => {
    const taxId = req.params.taxId; 
    const updates = req.body;  

    try {
        if (!taxId) {
            return res.status(400).json({
                status: 'error',
                message: 'Tax ID is required'
            });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No update fields provided'
            });
        }

        const allowedUpdates = ['tax_name', 'tax_rate', 'description', 'tax_status'];
        const updatesKeys = Object.keys(updates);
        const isValidOperation = updatesKeys.every(key => allowedUpdates.includes(key));

        if (!isValidOperation) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid updates. Allowed fields: ${allowedUpdates.join(', ')}`
            });
        }

        const updatedTax = await TaxService.updateTax(taxId, updates);

        return res.status(200).json({
            status: 'success',
            message: 'Tax updated successfully',
            data: updatedTax
        });

    } catch (err) {
        console.error('Update Tax Error:', err);

        if (err instanceof TaxError) {
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
};

exports.deleteTax = async (req, res) => {
    const { taxId } = req.params;
 
    try {
        if (!taxId) {
            return res.status(400).json({
                status: 'error',
                message: 'Tax ID is required'
            });
        }
 
        const result = await TaxService.deleteTax(taxId);
        return res.status(200).json({
            status: 'success',
            message: 'Tax deleted successfully',
            data: result
        });
        
    } catch (err) {
        console.error('Delete Tax Error:', err);
 
        if (err instanceof TaxError) {
            return res.status(err.statusCode).json({
                status: 'error',
                type: err.type,
                message: err.message
            });
        }
 
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete tax', 
            error: err.message
        });
    }
 };
