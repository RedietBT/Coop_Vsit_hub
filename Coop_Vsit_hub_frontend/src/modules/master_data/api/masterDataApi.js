import apiClient from '@/core/api/apiClient';

export const masterDataApi = {
  // --- Departments ---
  getDepartments: async (activeOnly = true) => {
    const response = await apiClient.get('/api/v1/departments', {
      params: { activeOnly },
    });
    return response.data;
  },
  createDepartment: async (payload) => {
    const response = await apiClient.post('/api/v1/departments', payload);
    return response.data;
  },
  updateDepartment: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/departments/${id}`, payload);
    return response.data;
  },
  deleteDepartment: async (id) => {
    const response = await apiClient.delete(`/api/v1/departments/${id}`);
    return response.data;
  },

  // --- Partnership Categories ---
  getCategories: async (activeOnly = true) => {
    const response = await apiClient.get('/api/v1/partnership-categories', {
      params: { activeOnly },
    });
    return response.data;
  },
  createCategory: async (payload) => {
    const response = await apiClient.post('/api/v1/partnership-categories', payload);
    return response.data;
  },
  updateCategory: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/partnership-categories/${id}`, payload);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/api/v1/partnership-categories/${id}`);
    return response.data;
  },

  // --- Meeting Rooms ---
  getMeetingRooms: async (activeOnly = true) => {
    const response = await apiClient.get('/api/v1/meeting-rooms', {
      params: { activeOnly },
    });
    return response.data;
  },
  createMeetingRoom: async (payload) => {
    const response = await apiClient.post('/api/v1/meeting-rooms', payload);
    return response.data;
  },
  updateMeetingRoom: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/meeting-rooms/${id}`, payload);
    return response.data;
  },
  deleteMeetingRoom: async (id) => {
    const response = await apiClient.delete(`/api/v1/meeting-rooms/${id}`);
    return response.data;
  },
};

export default masterDataApi;
