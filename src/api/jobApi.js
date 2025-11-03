import api from './axios';

export const jobApi = {
  // Job CRUD operations
  createJob: async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
  },

  getJobs: async (params = {}) => {
    const response = await api.get('/api/jobs', { params });
    return response.data;
  },

  getJob: async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}`);
    return response.data;
  },

  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/api/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId) => {
    const response = await api.delete(`/api/jobs/${jobId}`);
    return response.data;
  },

  publishJob: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/publish`);
    return response.data;
  },

  pauseJob: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/pause`);
    return response.data;
  },

  updateJobStatus: async (jobId, status) => {
    // Use specific endpoints for publish/pause per backend
    if (status === 'active') {
      const response = await api.post(`/api/jobs/${jobId}/publish`)
      return response.data
    }
    if (status === 'paused') {
      const response = await api.post(`/api/jobs/${jobId}/pause`)
      return response.data
    }
    // Fallback to generic update for other statuses if supported
    const response = await api.put(`/api/jobs/${jobId}`, { status })
    return response.data
  },

  getMyJobs: async (params = {}) => {
    const response = await api.get('/api/jobs/my-jobs', { params });
    return response.data;
  },

  getSchoolJobs: async (params = {}) => {
    const response = await api.get('/api/jobs/my-jobs', { params });
    return response.data;
  },

  getFeaturedJobs: async (limit = 6) => {
    const response = await api.get('/api/jobs/featured', { params: { limit } });
    return response.data;
  },

  searchJobs: async (query, params = {}) => {
    const response = await api.get('/api/jobs/search', { 
      params: { q: query, ...params } 
    });
    return response.data;
  },

  getJobsBySchool: async (schoolId, params = {}) => {
    const response = await api.get(`/api/jobs/school/${schoolId}`, { params });
    return response.data;
  },

  // Template operations
  getTemplates: async (params = {}) => {
    const response = await api.get('/api/templates', { params });
    return response.data;
  },

  getTemplate: async (templateId) => {
    const response = await api.get(`/api/templates/${templateId}`);
    return response.data;
  },

  createTemplate: async (templateData) => {
    const response = await api.post('/api/templates', templateData);
    return response.data;
  },

  updateTemplate: async (templateId, templateData) => {
    const response = await api.put(`/api/templates/${templateId}`, templateData);
    return response.data;
  },

  deleteTemplate: async (templateId) => {
    const response = await api.delete(`/api/templates/${templateId}`);
    return response.data;
  },

  useTemplate: async (templateId) => {
    const response = await api.post(`/api/templates/${templateId}/use`);
    return response.data;
  },

  getPublicTemplates: async (params = {}) => {
    const response = await api.get('/api/templates/public', { params });
    return response.data;
  },

  getTemplateCategories: async () => {
    const response = await api.get('/api/templates/categories');
    return response.data;
  },

  duplicateTemplate: async (templateId) => {
    const response = await api.post(`/api/templates/${templateId}/duplicate`);
    return response.data;
  },

  // Analytics operations
  getJobAnalytics: async (jobId) => {
    const response = await api.get(`/api/analytics/job/${jobId}`);
    return response.data;
  },

  getSchoolAnalytics: async () => {
    const response = await api.get('/api/analytics/school');
    return response.data;
  },

  getAdminAnalytics: async () => {
    const response = await api.get('/api/analytics/admin');
    return response.data;
  },

  getAnalyticsByDateRange: async (params) => {
    const response = await api.get('/api/analytics/range', { params });
    return response.data;
  },

  exportAnalytics: async (params = {}) => {
    const response = await api.get('/api/analytics/export', { 
      params,
      responseType: 'blob' // For file downloads
    });
    return response.data;
  }
};

