class ValidationException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationException';
        this.statusCode = 400;
    }
}

module.exports = {ValidationException};