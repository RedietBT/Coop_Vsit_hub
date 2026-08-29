import apiClient from '@/core/api/apiClient';

export const toInstantIso = (val) => {
  if (!val) return null;
  if (typeof val !== 'string') {
    try {
      return new Date(val).toISOString();
    } catch {
      return val;
    }
  }
  const trimmed = val.trim();
  if (trimmed.endsWith('Z')) return trimmed;
  // If format is YYYY-MM-DDTHH:mm, append :00Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}Z`;
  }
  try {
    return new Date(trimmed).toISOString();
  } catch {
    return trimmed;
  }
};

export const visitApi = {
  getAllVisits: async (params = {}) => {
    const response = await apiClient.get('/api/v1/visits', { params });
    return response.data;
  },

  getVisitById: async (id) => {
    const response = await apiClient.get(`/api/v1/visits/${id}`);
    return response.data;
  },

  getVisitByCode: async (visitCode) => {
    const response = await apiClient.get(`/api/v1/visits/code/${visitCode}`);
    return response.data;
  },

  getVisitStats: async () => {
    const response = await apiClient.get('/api/v1/visits/stats');
    return response.data;
  },

  createVisit: async (payload) => {
    const cleanPayload = { ...payload };
    if (cleanPayload.scheduledStartTime) {
      cleanPayload.scheduledStartTime = toInstantIso(cleanPayload.scheduledStartTime);
    }
    if (cleanPayload.scheduledEndTime) {
      cleanPayload.scheduledEndTime = toInstantIso(cleanPayload.scheduledEndTime);
    }
    const response = await apiClient.post('/api/v1/visits', cleanPayload);
    return response.data;
  },

  updateVisit: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/visits/${id}`, payload);
    return response.data;
  },

  updateVisitorDetails: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/visits/${id}/visitor`, payload);
    return response.data;
  },

  transitionStatus: async (id, payload) => {
    // payload: { targetStatus: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'CANCELLED', approverComments: string }
    const response = await apiClient.put(`/api/v1/visits/${id}/status`, payload);
    return response.data;
  },

  checkIn: async (id, payload = {}) => {
    // payload: { customBadgeNumber, verifiedIdNumber, visitorCount, notes }
    const response = await apiClient.post(`/api/v1/visits/${id}/check-in`, payload);
    return response.data;
  },

  checkOut: async (id, payload = {}) => {
    // payload: { departureNotes }
    const response = await apiClient.post(`/api/v1/visits/${id}/check-out`, payload);
    return response.data;
  },

  deleteVisit: async (id) => {
    const response = await apiClient.delete(`/api/v1/visits/${id}`);
    return response.data;
  },

  // Helper selectors for dropdowns
  getOrganizations: async () => {
    const response = await apiClient.get('/api/v1/organizations', { params: { size: 100 } });
    return response.data?.content || response.data || [];
  },

  getIndividualGuests: async () => {
    const response = await apiClient.get('/api/v1/guests', { params: { size: 100 } });
    return response.data?.content || response.data || [];
  },

  getRoomSlots: async (roomName, fromDate, toDate) => {
    const params = { roomName };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await apiClient.get('/api/v1/visits/room-slots', { params });
    return response.data || [];
  },

  getAdminRoomBookings: async (roomName, fromDate, toDate) => {
    const params = {};
    if (roomName) params.roomName = roomName;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await apiClient.get('/api/v1/visits/room-bookings', { params });
    return response.data || [];
  },
};

export default visitApi;
