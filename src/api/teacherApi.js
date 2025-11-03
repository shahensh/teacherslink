import api from './axios'

export const teacherApi = {
  // Get teacher profile
  getProfile: async () => {
    console.log('Calling teacherApi.getProfile()...');
    const response = await api.get('/api/teachers/profile')
    console.log('teacherApi.getProfile() response:', response.data);
    return response.data
  },

  // Get teacher profile by ID (for viewing other teachers' profiles)
  getProfileById: async (id) => {
    console.log('Calling teacherApi.getProfileById() with id:', id);
    const response = await api.get(`/api/teachers/profile/${id}`)
    console.log('teacherApi.getProfileById() response:', response.data);
    return response.data
  },

  // Update teacher profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/teachers/profile', profileData)
    return response.data
  },

  // Check username availability
  checkUsername: async (username) => {
    const response = await api.get(`/api/teachers/check-username/${username}`)
    return response.data
  },

  // Upload profile image
  uploadProfileImage: async (formData) => {
    console.log('Uploading profile image to API...');
    const response = await api.post('/api/teachers/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    console.log('Profile image upload API response:', response.data);
    return response.data
  },

  // Upload cover image
  uploadCoverImage: async (formData) => {
    console.log('Uploading cover image to API...');
    const response = await api.post('/api/teachers/upload-cover-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    console.log('Cover image upload API response:', response.data);
    return response.data
  },

  // Upload teacher photos
  uploadPhotos: async (photos) => {
    const formData = new FormData()
    photos.forEach(photo => {
      formData.append('photos', photo)
    })
    const response = await api.post('/api/teachers/upload-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Get teacher's job applications
  getJobApplications: async (params = {}) => {
    const response = await api.get('/api/teachers/applications', { params })
    return response.data
  },

  // Apply for a job
  applyForJob: async (jobId, applicationData) => {
    const response = await api.post(`/api/jobs/${jobId}/apply`, applicationData)
    return response.data
  },

  // Update application
  updateApplication: async (applicationId, applicationData) => {
    const response = await api.put(`/api/applications/${applicationId}`, applicationData)
    return response.data
  },

  // Withdraw application
  withdrawApplication: async (applicationId) => {
    const response = await api.delete(`/api/applications/${applicationId}`)
    return response.data
  }
}
