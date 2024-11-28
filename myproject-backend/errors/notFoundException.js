class NotFoundException extends Error {
  constructor(message, type, statusCode) {
    super(message);
    this.name = "NotFoundException";
    this.type = type;
    this.statusCode = statusCode;
  }
}

class UserNotFoundException extends NotFoundException {
  constructor(username) {
    super(`User ${username} not found`,'user', 404);
    this.name = "UserNotFoundException";
  }
}

module.exports = { NotFoundException, UserNotFoundException };