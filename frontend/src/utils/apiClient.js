import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error safely for debugging
    try {
      const errorInfo = {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      };
      console.warn('API Request Failed:', errorInfo);
    } catch (e) {
      // Silently fail logging to avoid breaking the app
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Don't redirect if we're already on login or register pages
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
