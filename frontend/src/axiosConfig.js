import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3002/api', // Your backend server URL
});

// Request interceptor to add the token to headers
instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('http://localhost:3002/api/user/refresh-token', { refreshToken });
          if (response.status === 200) {
            const { accessToken, refreshToken: newRefreshToken, user } = response.data;

            // Store the new access token and refresh token
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('username', user.username);

            // Update the Authorization header
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

            return instance(originalRequest);
          }
        }
      } catch (err) {
        console.error('Error refreshing token:', err);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
