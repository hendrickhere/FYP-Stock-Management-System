const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/app.config.js');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(500).json({ message: 'Failed to authenticate token' });
      }

        req.user = { 
        id: decoded.id, 
        username: decoded.username,
        role: decoded.role 
        };
      next();
    });
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
