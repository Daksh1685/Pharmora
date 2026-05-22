import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
    // Unwrap nested data structure: response.data.data contains { user, token }
    return response.data.data; // Returns { user: {...}, token: "jwt_token" }
  },

  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);
    // Unwrap nested data structure: response.data.data contains { user, token }
    return response.data.data; // Returns { user: {...}, token: "jwt_token" }
  },

  googleLogin: async (googleData) => {
    const response = await apiClient.post(API_ENDPOINTS.GOOGLE_LOGIN || '/auth/google', googleData);
    return response.data.data;
  },

  logout: async () => {
    await apiClient.post(API_ENDPOINTS.LOGOUT);
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    console.log('GET CURRENT USER RESPONSE:', response.data);
    return response.data.data?.user || response.data.data || response.data;
  },

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  },
};
