import apiClient from '@/core/api/apiClient';

export const notificationApi = {
  getMyNotifications: async (page = 0, size = 20) => {
    const response = await apiClient.get('/api/v1/notifications', {
      params: { page, size },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/api/v1/notifications/unread-count');
    return response.data; // { count: number }
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/api/v1/notifications/read-all');
    return response.data;
  },

  dismissNotification: async (notificationId) => {
    const response = await apiClient.delete(`/api/v1/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationApi;
