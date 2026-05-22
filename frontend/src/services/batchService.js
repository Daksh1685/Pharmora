import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const batchService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_BATCHES, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_BATCH(id));
    return response.data;
  },

  create: async (batchData) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_BATCH, batchData);
    return response.data;
  },

  update: async (id, batchData) => {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_BATCH(id), batchData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_BATCH(id));
    return response.data;
  },
};
