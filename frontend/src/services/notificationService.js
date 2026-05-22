import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const notificationService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.GET_NOTIFICATIONS, { params });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await apiClient.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(id));
    return response.data;
  },
};
