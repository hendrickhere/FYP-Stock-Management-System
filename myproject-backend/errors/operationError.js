class OperationException extends Error {
    constructor(message) {
        super(message);
        this.name = 'OperationException';
        this.statusCode = 400;
    }
}

class DatabaseOperationException extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'DatabaseOperationException';
        this.statusCode = 500;
        this.details = details;
    }
}

module.exports = {OperationException, DatabaseOperationException};