import api from './api.js';

/**
 * Profile service communicating with backend /api/users endpoints.
 */
export const profileService = {
  /**
   * Retrieve the logged-in user's profile.
   */
  getMyProfile: async () => {
    return await api.get('/api/users/me');
  },

  /**
   * Update profile fields (name, department, year).
   */
  updateMyProfile: async (profileData) => {
    return await api.patch('/api/users/me', profileData);
  },
};

export default profileService;
