class TaxError extends Error {
    constructor(message, type, statusCode) {
        super(message);
        this.name = 'TaxError';
        this.type = type;
        this.statusCode = statusCode;
    }
}

module.exports = TaxError;

