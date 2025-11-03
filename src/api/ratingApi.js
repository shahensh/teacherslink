import api from './axios';

export const ratingApi = {
  // Submit a rating for a school
  submitRating: async (ratingData) => {
    try {
      const response = await api.post('/api/ratings', ratingData);
      return response.data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  },

  // Get ratings for a school
  getSchoolRatings: async (schoolId, page = 1, limit = 10) => {
    try {
      console.log('RatingApi - getSchoolRatings called:', { schoolId, page, limit });
      
      if (!schoolId) {
        throw new Error('School ID is required');
      }
      
      const response = await api.get(`/api/ratings/school/${schoolId}`, {
        params: { page, limit }
      });
      console.log('RatingApi - getSchoolRatings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching school ratings:', error);
      console.error('Error response:', error.response?.data);
      
      // Return a default structure if there's an error
      if (error.response?.status === 404 || error.response?.status === 500) {
        return {
          success: true,
          data: {
            averageRating: {
              averageRating: 0,
              totalRatings: 0,
              workEnvironment: 0,
              management: 0,
              salary: 0,
              benefits: 0,
              careerGrowth: 0
            },
            ratings: [],
            pagination: {
              current: 1,
              pages: 0,
              total: 0
            }
          }
        };
      }
      
      throw error;
    }
  },

  // Get teacher's rating for a school
  getTeacherRating: async (schoolId) => {
    try {
      const response = await api.get(`/api/ratings/school/${schoolId}/teacher`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher rating:', error);
      throw error;
    }
  },

  // Delete a rating
  deleteRating: async (ratingId) => {
    try {
      const response = await api.delete(`/api/ratings/${ratingId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  }
};

export default ratingApi;
