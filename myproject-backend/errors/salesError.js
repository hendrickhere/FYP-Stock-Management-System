class SalesError extends Error {
    constructor(message, type, statusCode) {
        super(message);
        this.name = 'SalesError';
        this.type = type;
        this.statusCode = statusCode;
    }
}

module.exports = SalesError;