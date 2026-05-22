import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const medicineService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_MEDICINES, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_MEDICINE(id));
    return response.data;
  },

  create: async (medicineData) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_MEDICINE, medicineData);
    return response.data;
  },

  update: async (id, medicineData) => {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_MEDICINE(id), medicineData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_MEDICINE(id));
    return response.data;
  },

  search: async (query) => {
    return medicineService.getAll({ search: query });
  },
};
