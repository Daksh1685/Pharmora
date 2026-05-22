import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const purchaseService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_PURCHASES, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_PURCHASE(id));
    return response.data;
  },

  create: async (purchaseData) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_PURCHASE, purchaseData);
    return response.data;
  },

  update: async (id, purchaseData) => {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_PURCHASE(id), purchaseData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_PURCHASE(id));
    return response.data;
  },
};
