import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Public API client for unauthenticated meeting room display dashboards.
 * Direct axios instance without auth headers to ensure zero credential requirements.
 */
const publicClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicRoomScheduleApi = {
  /**
   * Fetches the list of active meeting rooms for the dropdown filter.
   */
  getPublicRooms: async () => {
    const response = await publicClient.get('/api/v1/public/room-schedule/rooms');
    return response.data;
  },

  /**
   * Fetches the live room booking schedule for a given date, reserver info, and occupancy.
   * @param {Object} params - { roomName, date }
   */
  getTodaySchedule: async (params = {}) => {
    const response = await publicClient.get('/api/v1/public/room-schedule/today', { params });
    return response.data;
  },

  getRoomSchedule: async (params = {}) => {
    const response = await publicClient.get('/api/v1/public/room-schedule/today', { params });
    return response.data;
  },
};

export default publicRoomScheduleApi;

