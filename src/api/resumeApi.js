import axios from 'axios';

const API_URL = '/api/resumes';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Resume API functions
export const resumeApi = {
  // Create or update resume
  createOrUpdateResume: async (resumeData) => {
    try {
      const response = await api.post('/', resumeData);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating resume:', error);
      throw error;
    }
  },

  // Get my resume
  getMyResume: async () => {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching my resume:', error);
      throw error;
    }
  },

  // Get teacher resume by teacher ID
  getTeacherResume: async (teacherId) => {
    try {
      const response = await api.get(`/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher resume:', error);
      throw error;
    }
  },

  // Generate PDF resume
  generateResumePDF: async (resumeId) => {
    try {
      const response = await api.get(`/${resumeId}/pdf`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Error generating resume PDF:', error);
      throw error;
    }
  },

  // Generate teacher resume PDF
  generateTeacherResumePDF: async (teacherId) => {
    try {
      let url;
      if (teacherId) {
        // For schools viewing a specific teacher's resume
        url = `/teacher/${teacherId}/pdf`;
      } else {
        // For teachers viewing their own resume
        url = `/me/pdf`;
      }
      
      const response = await api.get(url, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Error generating teacher resume PDF:', error);
      throw error;
    }
  },

  // Delete resume
  deleteResume: async () => {
    try {
      const response = await api.delete('/me');
      return response.data;
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  },

  // View resume PDF in new tab
  viewResumePDF: async (resumeId) => {
    try {
      const response = await resumeApi.generateResumePDF(resumeId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Error viewing resume PDF:', error);
      return { success: false, error: error.message };
    }
  },

  // View teacher resume PDF in new tab
  viewTeacherResumePDF: async (teacherId) => {
    try {
      const response = await resumeApi.generateTeacherResumePDF(teacherId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Error viewing teacher resume PDF:', error);
      return { success: false, error: error.message };
    }
  },

  // View my own resume PDF in new tab (for teachers)
  viewMyResumePDF: async () => {
    try {
      const response = await resumeApi.generateTeacherResumePDF();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Error viewing my resume PDF:', error);
      return { success: false, error: error.message };
    }
  },

  // Download resume PDF
  downloadResumePDF: async (resumeId, filename = 'resume.pdf') => {
    try {
      const response = await resumeApi.generateResumePDF(resumeId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error downloading resume PDF:', error);
      return { success: false, error: error.message };
    }
  },

  // Download teacher resume PDF
  downloadTeacherResumePDF: async (teacherId, filename = 'teacher_resume.pdf') => {
    try {
      const response = await resumeApi.generateTeacherResumePDF(teacherId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error downloading teacher resume PDF:', error);
      return { success: false, error: error.message };
    }
  }
};

export default resumeApi;

