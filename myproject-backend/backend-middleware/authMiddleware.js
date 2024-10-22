const jwt = require('jsonwebtoken');
const secret = 'secretkey123';
const UserService = require('../service/userService');

module.exports = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract the token after 'Bearer'
  if (!token) {
    console.error("No token provided");
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'secretkey123', (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res.status(500).json({ message: 'Failed to authenticate token' }); // Add return here
    }

    req.user = { id: decoded.id };
    console.log("Authenticated user ID:", req.user.id);
    next();
  });
};
