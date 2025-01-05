import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3002/api',
  maxContentLength: 50000000,
  maxBodyLength: 50000000,
});

let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
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
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Add request to queue
        const retryOriginal = new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });

        if (failedQueue.length === 1) {
          // Only refresh token for first failed request
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            processQueue(new Error('No refresh token'));
            return Promise.reject(error);
          }

          try {
            const response = await axios.post('/api/auth/refresh', { refreshToken });
            const { accessToken } = response.data;
            
            localStorage.setItem('accessToken', accessToken);
            
            // Update authorization header
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            
            processQueue(null, accessToken);
            
            // Retry original request
            return axios(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError);
            return Promise.reject(refreshError);
          }
        }

        return retryOriginal;
      } catch (refreshError) {
        return Promise.reject(refreshError);
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