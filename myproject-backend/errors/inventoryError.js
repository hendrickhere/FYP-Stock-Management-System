class InventoryError extends Error {
    constructor(message, type, statusCode) {
        super(message);
        this.name = 'InventoryError';
        this.type = type;
        this.statusCode = statusCode;
    }
}

module.exports= {InventoryError};