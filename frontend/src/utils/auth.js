const axios = require('../axiosConfig');

const validateToken = async (token) => {
  try {
    const response = await axios.post('/api/auth/validate', { token });
    return response.data.valid;
  } catch (error) {
    return false;
  }
};

const login = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('token');
};

module.exports = {
  validateToken,
  login,
  logout
};
