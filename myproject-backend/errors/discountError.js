class DiscountError extends Error {
    constructor(message, type, statusCode) {
        super(message);
        this.name = 'DiscountError';
        this.type = type;
        this.statusCode = statusCode;
    }
}

module.exports = DiscountError;