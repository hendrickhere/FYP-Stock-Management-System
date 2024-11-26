class SalesError extends Error {
    constructor(message, type, statusCode) {
        super(message);
        this.name = 'SalesError';
        this.type = type;
        this.statusCode = statusCode;
    }
}
class InvalidTimeRangeError extends SalesError {
    constructor(message = 'Invalid time range provided') {
      super(message, 400);
      this.name = 'InvalidTimeRangeError';
    }
  }
  
  class UserNotFoundError extends SalesError {
    constructor(username) {
      super(`User ${username} not found`, 404);
      this.name = 'UserNotFoundError';
    }
  }
  
  class DatabaseError extends SalesError {
    constructor(message = 'Database operation failed') {
      super(message, 500);
      this.name = 'DatabaseError';
    }
  }

  module.exports = { SalesError, InvalidTimeRangeError, UserNotFoundError, DatabaseError };
