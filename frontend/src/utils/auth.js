import axios from 'axios';

export const validateToken = async (token) => {
  try {
    const response = await axios.post('/api/auth/validate', { token });
    return response.data;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};
