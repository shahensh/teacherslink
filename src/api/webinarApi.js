import api from './axios';

export const webinarApi = {
  // Get all webinars
  getAllWebinars: async (params = {}) => {
    const response = await api.get('/api/webinars', { params });
    return response.data;
  },

  // Get webinar by ID
  getWebinarById: async (id) => {
    const response = await api.get(`/api/webinars/${id}`);
    return response.data;
  },

  // Create new webinar
  createWebinar: async (webinarData) => {
    const response = await api.post('/api/webinars', webinarData);
    return response.data;
  },

  // Update webinar
  updateWebinar: async (id, webinarData) => {
    const response = await api.put(`/api/webinars/${id}`, webinarData);
    return response.data;
  },

  // Delete webinar
  deleteWebinar: async (id) => {
    const response = await api.delete(`/api/webinars/${id}`);
    return response.data;
  },

  // Join webinar
  joinWebinar: async (id) => {
    const response = await api.post(`/api/webinars/${id}/join`);
    return response.data;
  },

  // Leave webinar
  leaveWebinar: async (id) => {
    const response = await api.post(`/api/webinars/${id}/leave`);
    return response.data;
  },


  // Upload webinar thumbnail
  uploadThumbnail: async (file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    const response = await api.post('/api/webinars/upload-thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload webinar video with progress tracking
  uploadVideo: async (file, onProgress = null) => {
    const formData = new FormData();
    formData.append('video', file);
    
    let uploadStartTime = null;
    let compressionStartTime = null;
    
    const response = await api.post('/api/webinars/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for video uploads
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          if (!uploadStartTime) {
            uploadStartTime = Date.now();
            onProgress(0, 'uploading');
          }
          
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          
          // Simulate compression phase after 80% upload
          if (percentCompleted >= 80 && !compressionStartTime) {
            compressionStartTime = Date.now();
            onProgress(80, 'compressing');
          } else if (percentCompleted < 80) {
            onProgress(percentCompleted, 'uploading');
          } else {
            // After compression starts, show 80-95% range
            const compressionProgress = Math.min(95, 80 + Math.round((percentCompleted - 80) * 0.75));
            onProgress(compressionProgress, 'compressing');
          }
        }
      }
    });
    return response.data;
  },

  // Get webinar statistics
  getWebinarStats: async () => {
    const response = await api.get('/api/webinars/stats');
    return response.data;
  }
};

export default webinarApi;
