import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3002/api',
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
      // Log successful responses
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
    
    // Check if this is an invalid manager password error
    if (error.response?.status === 401 && error.response?.data?.code === 'INVALID_MANAGER_PASSWORD') {
      // Don't redirect to login, just reject with the error
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post('http://localhost:3002/api/user/refresh-token', { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        
        instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        return instance(originalRequest);
      } catch (error) {
        // Only clear storage and redirect for actual auth failures
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
        
        // Log outgoing requests
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