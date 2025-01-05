const mockAxios = require('../setup/axiosMock');
jest.mock('axios', () => mockAxios);

const { validateToken, login, logout } = require('../../utils/auth');

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const mockToken = 'valid-token';
      mockAxios.post.mockResolvedValueOnce({ data: { valid: true } });

      const result = await validateToken(mockToken);
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const mockToken = 'invalid-token';
      mockAxios.post.mockRejectedValueOnce(new Error('Invalid token'));

      const result = await validateToken(mockToken);
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('should store token and return user data on successful login', async () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: 1,
            username: 'testuser'
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await login(mockCredentials);

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on failed login', async () => {
      const mockCredentials = {
        username: 'wronguser',
        password: 'wrongpass'
      };

      mockAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(login(mockCredentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      logout();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});