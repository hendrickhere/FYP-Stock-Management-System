const ProductService = require("../service/productService");
const UserService = require("../service/userService");
const {UserNotFoundException, PurchaseOrderNotFoundException, ProductNotFoundException, NotFoundException} = require("../errors/notFoundException");
const {ValidationException} = require("../errors/validationError");
exports.addProductUnit = async (req, res) => {
    const { products, purchaseOrderId, username } = req.body;

    try {
        if (!products || !purchaseOrderId || !username) {
            throw new ValidationException('Missing required fields');
        }

        const user = await UserService.getUserByUsernameAsync(username);
        if (!user) {
            throw new UserNotFoundException(username);
        }

        await ProductService.addProductUnit(purchaseOrderId, products);
        
        return res.status(201).json({
            success: true,
            message: 'Product units successfully added'
        });

    } catch (err) {
        if (err instanceof UserNotFoundException) {
            return res.status(err.statusCode).json({
                success: false,
                error: err.message
            });
        }
        
        if (err instanceof ValidationException) {
            return res.status(err.statusCode).json({
                success: false,
                error: err.message
            });
        }

        if (err instanceof WarrantyNotFoundException) {
            return res.status(err.statusCode).json({
                success: false,
                error: err.message
            });
        }

        if (err instanceof DatabaseOperationException) {
            return res.status(err.statusCode).json({
                success: false,
                error: err.message,
                details: process.env.NODE_ENV === 'development' ? err.details : undefined
            });
        }

        console.error('Unexpected error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};