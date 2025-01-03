const { expect } = require('../../helpers/jest.setup');
const sinon = require('sinon');
const UserController = require('../../../controller/userController');
const UserService = require('../../../service/userService');
const { mockUsers } = require('../../helpers/mockData');

describe('UserController Unit Tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('login', () => {
    it('should return tokens and user data on successful authentication', async () => {
      const req = {
        body: {
          email: mockUsers.valid.email,
          password: mockUsers.valid.password
        }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      sinon.stub(UserService, 'verifyUser').resolves({
        ...mockUsers.valid,
        id: 1
      });

      await UserController.login(req, res);

      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(
        sinon.match({
          message: 'Login successful',
          accessToken: sinon.match.string,
          refreshToken: sinon.match.string
        })
      );
    });
  });
});