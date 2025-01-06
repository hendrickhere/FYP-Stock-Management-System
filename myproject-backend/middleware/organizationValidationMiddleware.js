const { query, body, validationResult } = require('express-validator');

const validateOrganizationRequest = {
    getOrganization: [
        query('organizationId')
            .exists().withMessage('Organization ID is required')
            .notEmpty().withMessage('Organization ID cannot be empty')
            .trim()
            .escape(),
            
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }
            next();
        }
    ],

    updateOrganization: [
        body('organization_id')
            .exists().withMessage('Organization ID is required')
            .notEmpty().withMessage('Organization ID cannot be empty'),
            
        body('organization_name')
            .optional()
            .isString().withMessage('Organization name must be a string')
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('Organization name must be between 2 and 100 characters'),
            
        body('organization_email')
            .optional()
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),
            
        body('organization_contact')
            .optional()
            .matches(/^\+?[\d\s-]+$/).withMessage('Invalid contact number format'),
            
        body('organization_address')
            .optional()
            .isString().withMessage('Address must be a string')
            .trim(),
            
        body('organization_bank')
            .optional()
            .isString().withMessage('Bank name must be a string')
            .trim(),
            
        body('organization_account_number')
            .optional()
            .matches(/^\d+$/).withMessage('Account number must contain only digits'),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }
            next();
        }
    ]
};

module.exports = validateOrganizationRequest;