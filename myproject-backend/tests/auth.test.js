const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, sequelize } = require('../server');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/app.config');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('POST /api/user/signup', () => {
    const validSignupData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    // Add your signup tests here
  });
});
