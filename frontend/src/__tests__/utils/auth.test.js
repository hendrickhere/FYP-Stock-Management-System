import { validateToken, login, logout } from '../../utils/auth';
import axios from 'axios';

jest.mock('axios');

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            username: 'testuser',
            organizationId: 1
          }
        }
      };
      
      axios.post.mockResolvedValueOnce(mockResponse);

      const credentials = {
        username: 'testuser',
        password: 'password123'
      };

      const result = await login(credentials);

      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      axios.post.mockRejectedValueOnce(new Error(errorMessage));

      const credentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      await expect(login(credentials)).rejects.toThrow(errorMessage);
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      logout();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockResponse = {
        data: {
          valid: true,
          user: {
            username: 'testuser',
            organizationId: 1
          }
        }
      };
      
      axios.post.mockResolvedValueOnce(mockResponse);
      const result = await validateToken('valid-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle invalid token', async () => {
      axios.post.mockRejectedValueOnce(new Error('Invalid token'));
      await expect(validateToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });
});