import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const saleService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_SALES, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_SALE(id));
    return response.data;
  },

  create: async (saleData) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_SALE, saleData);
    return response.data;
  },

  update: async (id, saleData) => {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_SALE(id), saleData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_SALE(id));
    return response.data;
  },
};
