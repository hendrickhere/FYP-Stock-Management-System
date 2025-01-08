const { expect, sequelize } = require('../../helpers/jest.setup');
const { app } = require('../../../server');
const { mockUsers, createHashedUser } = require('../../helpers/mockData');
const { User } = require('../../../models');
const request = require('supertest')(app);

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    // Clear users table before each test
    await User.destroy({ where: {} });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      const hashedUser = await createHashedUser(mockUsers.valid);
      await User.create(hashedUser);
    });

    it('should successfully authenticate valid user', async () => {
      const response = await request
        .post('/api/user/login')
        .send({
          email: mockUsers.valid.email,
          password: mockUsers.valid.password
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('accessToken');
      expect(response.body).to.have.property('refreshToken');
      expect(response.body.user).to.have.property('username', mockUsers.valid.username);
    });

    it('should handle invalid credentials', async () => {
      const response = await request
        .post('/api/user/login')
        .send({
          email: mockUsers.valid.email,
          password: 'wrongpassword'
        });

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Invalid email or password');
    });
  });
});