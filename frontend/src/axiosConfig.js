import axios from 'axios';

// config/environment.js
const getApiUrl = () => {
  const env = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
    case 'staging':
      return process.env.REACT_APP_API_URL || 'https://api.yourstaging.com';
    case 'production':
      return process.env.REACT_APP_API_URL || 'https://uat.stocksavvy.biz/api';
    default: return ""
  }
};

// axiosConfig.js

const instance = axios.create({
  baseURL: `${getApiUrl()}`,
  maxContentLength: 50000000,
  maxBodyLength: 50000000,
});

let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('Response error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.status === 401 && error.response?.data?.code === 'INVALID_MANAGER_PASSWORD') {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${getApiUrl()}/user/refresh-token`, { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        
        instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        return instance(originalRequest);
      } catch (error) {
        if (!error.response?.data?.code === 'INVALID_MANAGER_PASSWORD') {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Outgoing request:', {
      url: config.url,
      method: config.method,
      params: config.params,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default instance;