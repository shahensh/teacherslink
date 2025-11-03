import api from './axios'

export const analyticsApi = {
  getSchoolAnalytics: async () => {
    const response = await api.get('/api/analytics/school')
    return response.data
  },

  getJobAnalytics: async (jobId) => {
    const response = await api.get(`/api/analytics/job/${jobId}`)
    return response.data
  }
}

export default analyticsApi







