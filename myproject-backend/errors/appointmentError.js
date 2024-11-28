class AppointmentError extends Error {
    constructor(message, type, statusCode) {
        super(message);
        this.name = 'AppointmentError';
        this.type = type;
        this.statusCode = statusCode;
    }
}

module.exports = AppointmentError;