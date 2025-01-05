const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, sequelize } = require('../../../server');
const { User } = require('../../../models');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../../../config/app.config');

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
      role: 'Staff',
      created_at: new Date().toISOString()
    };

    test('successfully creates a new user', async () => {
      const response = await request(app)
        .post('/api/user/signup')
        .send(validSignupData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created');
      
      const user = await User.findOne({ where: { email: validSignupData.email } });
      expect(user).toBeTruthy();
    });

    test('validates email format', async () => {
      const response = await request(app)
        .post('/api/user/signup')
        .send({
          ...validSignupData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please enter a valid email address');
    });

    test('prevents duplicate email registration', async () => {
      await User.create({
        ...validSignupData,
        password_hash: await bcrypt.hash(validSignupData.password, 10)
      });

      const response = await request(app)
        .post('/api/user/signup')
        .send(validSignupData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('This email is already registered');
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      const password_hash = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash,
        role: 'Staff',
        organization_id: 1
      });
    });

    test('successfully logs in user', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
      
      const decodedToken = jwt.verify(response.body.accessToken, JWT_CONFIG.ACCESS_TOKEN_SECRET);
      expect(decodedToken.username).toBe('testuser');
    });

    test('rejects invalid credentials', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/token/refresh', () => {
    let refreshToken;
    
    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'Staff'
      });

      refreshToken = jwt.sign(
        { id: user.user_id, username: user.username },
        JWT_CONFIG.REFRESH_TOKEN_SECRET,
        { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
      );

      await User.update(
        { refreshToken },
        { where: { user_id: user.user_id } }
      );
    });

    test('successfully refreshes access token', async () => {
      const response = await request(app)
        .post('/api/token/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
    });

    test('rejects invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/token/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });
});