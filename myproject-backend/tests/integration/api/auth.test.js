const { expect } = require('../../helpers/jest.setup');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../backend-middleware/authMiddleware');
const { JWT_CONFIG } = require('../../../config/app.config');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    next = sinon.spy();
    sinon.restore();
  });

  // Test missing authorization header
  it('should handle missing authorization header', () => {
    authMiddleware(req, res, next);
    
    expect(res.status).to.have.been.calledWith(401);
    expect(res.json).to.have.been.calledWith({
      message: 'No authorization header provided',
      code: 'AUTH_HEADER_MISSING'
    });
  });

  // Test malformed token
  it('should handle malformed token', () => {
    req.headers.authorization = 'Bearer invalid.token.format';
    
    authMiddleware(req, res, next);
    
    expect(res.status).to.have.been.calledWith(401);
    expect(res.json).to.have.been.calledWith({
      message: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  });

  // Test expired token handling
  it('should handle expired tokens', () => {
    const expiredToken = jwt.sign(
      { id: 1, username: 'test' },
      JWT_CONFIG.ACCESS_TOKEN_SECRET,
      { expiresIn: '0s' }
    );
    req.headers.authorization = `Bearer ${expiredToken}`;
    
    authMiddleware(req, res, next);
    
    expect(res.status).to.have.been.calledWith(401);
    expect(res.json).to.have.been.calledWith({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  });

  // Test successful token verification
  it('should process valid tokens correctly', () => {
    const validToken = jwt.sign(
      { id: 1, username: 'test', role: 'Staff' },
      JWT_CONFIG.ACCESS_TOKEN_SECRET
    );
    req.headers.authorization = `Bearer ${validToken}`;
    
    authMiddleware(req, res, next);
    
    expect(next).to.have.been.called;
    expect(req.user).to.deep.include({
      id: 1,
      username: 'test',
      role: 'Staff'
    });
  });

  // Test error handling
  it('should handle internal errors gracefully', () => {
    sinon.stub(jwt, 'verify').throws(new Error('Unexpected error'));
    req.headers.authorization = 'Bearer sometoken';
    
    authMiddleware(req, res, next);
    
    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({
      message: 'Internal server error'
    });
  });
});