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
  uploadRoomImage: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/api/v1/meeting-rooms/${id}/image`, formData, {
      headers: {
        'Content-Type': undefined, // Let browser set boundary!
      },
    });
    return response.data;
  },
  deleteMeetingRoom: async (id) => {
    const response = await apiClient.delete(`/api/v1/meeting-rooms/${id}`);
    return response.data;
  },
};

export const handleRoomApiError = (err, defaultMsg = 'Operation failed.') => {
  if (err?.response?.status === 403) {
    return 'You are only authorized to manage meeting rooms for your department.';
  }
  return err?.response?.data?.message || err?.response?.data?.error || defaultMsg;
};

export default masterDataApi;
