import api from './api.js';

/**
 * Authentication service communicating with backend /api/auth endpoints.
 */
export const authService = {
  /**
   * Synchronizes the authenticated Firebase user with the MongoDB database.
   * Returns the verified MongoDB user document with server-enforced role.
   */
  syncUser: async (userData = {}) => {
    return await api.post('/api/auth/sync', userData);
  },

  /**
   * Retrieves the current user's profile from MongoDB.
   */
  getCurrentUser: async () => {
    return await api.get('/api/auth/me');
  },
};

export default authService;
