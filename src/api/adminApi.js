import api from './axios'

export const adminApi = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/api/admin/dashboard')
    return response.data
  },

  // Get all users with filters
  getAllUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params })
    return response.data
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}`)
    return response.data
  },

  // Update user status
  updateUserStatus: async (userId, statusData) => {
    const response = await api.put(`/api/admin/users/${userId}/status`, statusData)
    return response.data
  },

  // Verify school
  verifySchool: async (schoolId) => {
    const response = await api.put(`/api/admin/schools/${schoolId}/verify`)
    return response.data
  },

  // Get pending verifications
  getPendingVerifications: async () => {
    const response = await api.get('/api/admin/verifications')
    return response.data
  },

  // Get all jobs (admin view)
  getAllJobs: async (params = {}) => {
    const response = await api.get('/api/admin/jobs', { params })
    return response.data
  },

  // Update job status
  updateJobStatus: async (jobId, statusData) => {
    const response = await api.put(`/api/admin/jobs/${jobId}/status`, statusData)
    return response.data
  },

  // Get all applications
  getAllApplications: async (params = {}) => {
    const response = await api.get('/api/admin/applications', { params })
    return response.data
  },

  // Get system analytics
  getSystemAnalytics: async (period = '30') => {
    const response = await api.get('/api/admin/analytics', { params: { period } })
    return response.data
  },

  // Get teachers with subscription data
  getTeachersWithSubscriptions: async (params = {}) => {
    const response = await api.get('/api/admin/teachers', { params })
    return response.data
  },

  // Get schools with subscription data
  getSchoolsWithSubscriptions: async (params = {}) => {
    const response = await api.get('/api/admin/schools', { params })
    return response.data
  }
}

export default adminApi






