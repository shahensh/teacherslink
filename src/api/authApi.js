import api from './axios'

export const authApi = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/api/auth/change-password', passwordData)
    return response.data
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default authApi








