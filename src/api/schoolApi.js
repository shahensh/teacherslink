import api from './axios'

export const schoolApi = {
  // Get school profile
  getProfile: async () => {
    const response = await api.get('/api/schools/profile')
    return response.data
  },

  // Get school profile by ID (for viewing other schools' profiles)
  getProfileById: async (id) => {
    const response = await api.get(`/api/schools/profile/${id}`)
    return response.data
  },

  // Update school profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/schools/profile', profileData)
    return response.data
  },

  // Check username availability
  checkUsername: async (username) => {
    const response = await api.get(`/api/schools/check-username/${username}`)
    return response.data
  },

  // Upload profile image
  uploadProfileImage: async (formData) => {
    const response = await api.post('/api/schools/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Upload cover image
  uploadCoverImage: async (formData) => {
    const response = await api.post('/api/schools/upload-cover-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Upload school photos
  uploadPhotos: async (photos) => {
    const formData = new FormData()
    photos.forEach(photo => {
      formData.append('photos', photo)
    })
    const response = await api.post('/api/schools/upload-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Get school's jobs
  getJobs: async (params = {}) => {
    const response = await api.get('/api/schools/jobs', { params })
    return response.data
  },

  // Post a new job
  postJob: async (jobData) => {
    const response = await api.post('/api/schools/jobs', jobData)
    return response.data
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/api/schools/jobs/${jobId}`, jobData)
    return response.data
  },

  // Delete job
  deleteJob: async (jobId) => {
    const response = await api.delete(`/api/schools/jobs/${jobId}`)
    return response.data
  },

  // Get job applications
  getJobApplications: async (jobId) => {
    const response = await api.get(`/api/schools/jobs/${jobId}/applications`)
    return response.data
  },

  // Update application status
  updateApplicationStatus: async (applicationId, statusData) => {
    const response = await api.put(`/api/applications/${applicationId}/status`, statusData)
    return response.data
  }
}
