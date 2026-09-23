import { apiClient } from './apiClient';

export const fileApi = {
  uploadFile: async (file) => {
    if (!file) throw new Error('No file provided');
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds 10MB limit. Please choose a file smaller than 10MB.');
    }
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': undefined, // Let browser set boundary!
      },
    });
    return response.data;
  },
};

export default fileApi;
