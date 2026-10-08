import apiClient from '@/core/api/apiClient';

export const roomBookingApi = {
  /**
   * Create a dedicated room reservation (decoupled from visits).
   */
  createBooking: async (data) => {
    const response = await apiClient.post('/api/v1/room-bookings', data);
    return response.data;
  },

  /**
   * List room bookings with search, room, and status filters (paginated).
   */
  getBookings: async (params = {}) => {
    const response = await apiClient.get('/api/v1/room-bookings', { params });
    return response.data;
  },

  /**
   * Get personal room bookings made by the currently authenticated user.
   */
  getMyBookings: async (params = {}) => {
    const response = await apiClient.get('/api/v1/room-bookings/my', { params });
    return response.data;
  },

  /**
   * Get reserved time slots for a specific room across a date range.
   */
  getRoomSlots: async (roomName, fromDate, toDate) => {
    const response = await apiClient.get('/api/v1/room-bookings/slots', {
      params: { roomName, fromDate, toDate },
    });
    return response.data;
  },

  /**
   * Get all active room bookings for a date range (for Front Desk smart matcher).
   */
  getActiveBookingsForDate: async (fromDate, toDate) => {
    const response = await apiClient.get('/api/v1/room-bookings/date', {
      params: { fromDate, toDate },
    });
    return response.data;
  },

  /**
   * Cancel an existing room booking with a reason.
   */
  cancelBooking: async (id, reason = '') => {
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    const response = await apiClient.delete(`/api/v1/room-bookings/${id}`, {
      data: { cancellationReason: trimmedReason },
      params: trimmedReason ? { reason: trimmedReason } : undefined,
    });
    return response.data;
  },

  /**
   * Fetch single booking detail by ID.
   */
  getBookingById: async (id) => {
    const response = await apiClient.get(`/api/v1/room-bookings/${id}`);
    return response.data;
  },
};

export default roomBookingApi;
