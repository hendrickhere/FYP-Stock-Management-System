const { expect, sinon } = require('../helpers/jest.setup');
const bcrypt = require('bcryptjs');
const UserService = require('../../service/userService');
const { User } = require('../../models');

describe('UserService', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('signup', () => {
        it('should successfully create a new user with valid data', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'Staff',
                created_at: new Date()
            };

            const hashedPassword = 'hashedPassword123';
            sandbox.stub(bcrypt, 'hash').resolves(hashedPassword);
            sandbox.stub(User, 'findOne').resolves(null);
            sandbox.stub(User, 'create').resolves({
                ...userData,
                password_hash: hashedPassword,
                password: undefined
            });

            const result = await UserService.signup(userData);

            expect(result).to.have.property('username', userData.username);
            expect(result).to.have.property('email', userData.email);
            expect(result).to.not.have.property('password');
            expect(result).to.have.property('password_hash', hashedPassword);
        });

        it('should throw error when username already exists', async () => {
            const userData = {
                username: 'existinguser',
                email: 'test@example.com',
                password: 'password123'
            };

            sandbox.stub(User, 'findOne').resolves({ username: 'existinguser' });

            try {
                await UserService.signup(userData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Username already exists');
            }
        });

        it('should throw error for invalid email format', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            };

            try {
                await UserService.signup(userData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('INVALID_EMAIL_FORMAT');
            }
        });

        it('should throw error for password shorter than 6 characters', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: '12345'
            };

            try {
                await UserService.signup(userData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('INVALID_PASSWORD_LENGTH');
            }
        });

        it('should throw error when email already exists', async () => {
            const userData = {
                username: 'newuser',
                email: 'existing@example.com',
                password: 'password123'
            };

            sandbox.stub(User, 'findOne').resolves({
                email: 'existing@example.com'
            });

            try {
                await UserService.signup(userData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('EMAIL_EXISTS');
            }
        });
    });

    describe('login', () => {
        it('should fail authentication with incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const mockUser = {
                id: 1,
                email: loginData.email,
                password_hash: 'hashedPassword'
            };

            sandbox.stub(User, 'findOne').resolves(mockUser);
            sandbox.stub(bcrypt, 'compare').resolves(false);

            const result = await UserService.verifyUser(loginData.email, loginData.password);
            expect(result).to.be.null;
        });

        it('should return null for non-existent user', async () => {
            sandbox.stub(User, 'findOne').resolves(null);

            const result = await UserService.verifyUser('nonexistent@example.com', 'password123');
            expect(result).to.be.null;
        });

        it('should properly store refresh token', async () => {
            const userId = 1;
            const refreshToken = 'test-refresh-token';
            const updateStub = sandbox.stub(User, 'update').resolves([1]);

            await UserService.storeRefreshToken(userId, refreshToken);

            expect(updateStub.calledOnce).to.be.true;
            expect(updateStub.firstCall.args[0]).to.deep.equal({ refreshToken });
            expect(updateStub.firstCall.args[1].where).to.deep.equal({ user_id: userId });
        });
    });
});