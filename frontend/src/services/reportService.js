import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const reportService = {
  getInventoryReport: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_INVENTORY_REPORT, { params });
    return response.data;
  },

  getSalesReport: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_SALES_REPORT, { params });
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_REPORTS, { params });
    return response.data;
  },
};
