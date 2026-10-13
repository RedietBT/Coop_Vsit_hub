import { apiClient } from './apiClient';

export const fileApi = {
  uploadFile: async (file) => {
    if (!file) throw new Error('No file provided');
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds 5MB limit. Please choose a file smaller than 5MB.');
    }
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default fileApi;
