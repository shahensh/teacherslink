import api from './axios'

export const applicationsApi = {
  submit: async (applicationData) => {
    console.log('ApplicationsApi - submit called with:', applicationData)
    
    // Create FormData for file uploads
    const formData = new FormData()
    
    // Add text fields
    console.log('ApplicationsApi - jobId:', applicationData.jobId, typeof applicationData.jobId)
    if (!applicationData.jobId) {
      throw new Error('jobId is required')
    }
    
    formData.append('jobId', applicationData.jobId)
    formData.append('coverLetter', applicationData.coverLetter || '')
    
    // Add resume file if provided
    if (applicationData.resume && applicationData.resume instanceof File) {
      formData.append('resume', applicationData.resume)
      console.log('ApplicationsApi - Added resume file:', applicationData.resume.name)
    }
    
    // Add portfolio files if provided
    if (applicationData.portfolio && Array.isArray(applicationData.portfolio)) {
      applicationData.portfolio.forEach((file, index) => {
        if (file instanceof File) {
          formData.append('portfolio', file)
          console.log('ApplicationsApi - Added portfolio file:', file.name)
        }
      })
    }
    
    // Add additional documents if provided
    if (applicationData.documents && Array.isArray(applicationData.documents)) {
      applicationData.documents.forEach((file, index) => {
        if (file instanceof File) {
          formData.append('documents', file)
          console.log('ApplicationsApi - Added document file:', file.name)
        }
      })
    }
    
    // Debug FormData contents
    console.log('ApplicationsApi - FormData contents:')
    for (let [key, value] of formData.entries()) {
      console.log(key, ':', value)
    }
    
    const response = await api.post('/api/applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  listMine: async () => {
    const response = await api.get('/api/applications/my')
    return response.data
  },
  checkApplicationStatus: async (jobId) => {
    try {
      const response = await api.get(`/api/applications/check/${jobId}`, {
        timeout: 5000 // 5 second timeout
      })
      return response.data
    } catch (error) {
      console.error('Error checking application status:', error)
      throw error
    }
  },
  updateApplicationStatus: async (applicationId, statusData) => {
    const response = await api.put(`/api/applications/${applicationId}/status`, statusData)
    return response.data
  },
  getApplication: async (applicationId) => {
    console.log('ApplicationsApi - Getting application:', applicationId)
    console.log('ApplicationsApi - Token:', localStorage.getItem('token') ? 'Exists' : 'Missing')
    const response = await api.get(`/api/applications/${applicationId}`)
    console.log('ApplicationsApi - Response:', response.data)
    return response.data
  },
  getSchoolApplications: async (params = {}) => {
    const response = await api.get('/api/applications/school', { params })
    return response.data
  },
  createApplication: async (applicationData) => {
    console.log('ApplicationsApi - createApplication called with:', applicationData)
    
    const response = await api.post('/api/applications/create', applicationData)
    return response.data
  },
  getApplications: async () => {
    const response = await api.get('/api/applications/my')
    return response.data
  },
  updateApplication: async (applicationId, updateData) => {
    const response = await api.put(`/api/applications/${applicationId}`, updateData)
    return response.data
  }
}

export default applicationsApi


