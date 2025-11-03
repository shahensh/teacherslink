import api from './axios';

// Content moderation API calls
export const contentModerationApi = {
  // Moderate post content
  moderatePost: async (content) => {
    try {
      const response = await api.post('/api/moderation/moderate', content);
      return response.data;
    } catch (error) {
      console.error('Content moderation failed:', error);
      throw error;
    }
  },

  // Get moderation statistics (admin only)
  getModerationStats: async () => {
    try {
      const response = await api.get('/api/moderation/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch moderation stats:', error);
      throw error;
    }
  }
};

export default contentModerationApi;
