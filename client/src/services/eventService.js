import api from './api.js';

/**
 * Event service communicating with backend /api/events and /api/registrations endpoints.
 */
export const eventService = {
  /**
   * Fetch all campus events with optional title search.
   */
  getEvents: async (searchQuery = '') => {
    const endpoint = searchQuery.trim()
      ? `/api/events?search=${encodeURIComponent(searchQuery.trim())}`
      : '/api/events';
    return await api.get(endpoint);
  },

  /**
   * Fetch a single event by ID.
   */
  getEventById: async (id) => {
    return await api.get(`/api/events/${id}`);
  },

  /**
   * Create a new campus event (Event Manager only).
   */
  createEvent: async (eventData) => {
    return await api.post('/api/events', eventData);
  },

  /**
   * Update an existing campus event (Event Manager creator only).
   */
  updateEvent: async (id, eventData) => {
    return await api.patch(`/api/events/${id}`, eventData);
  },

  /**
   * Delete an event and clean up registrations (Event Manager creator only).
   */
  deleteEvent: async (id) => {
    return await api.delete(`/api/events/${id}`);
  },

  /**
   * Register the logged-in student for an event (Student only).
   */
  registerForEvent: async (id) => {
    return await api.post(`/api/events/${id}/register`);
  },

  /**
   * Get the logged-in student's registered events (Student only).
   */
  getMyRegistrations: async () => {
    return await api.get('/api/registrations/me');
  },

  /**
   * Get attendee list for an event (Event Manager creator only).
   */
  getEventRegistrations: async (id) => {
    return await api.get(`/api/events/${id}/registrations`);
  },
};

export default eventService;
