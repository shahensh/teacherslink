import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased to 30s for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // Validate token format before sending
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        console.error('Invalid JWT token format detected, clearing auth data')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(new Error('Invalid token format'))
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add retry interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const config = error.config
    
    // Retry logic for network errors
    if (!config || !config.retry) {
      config.retry = 0
    }
    
    if (config.retry < 3 && (
      error.code === 'NETWORK_ERROR' || 
      error.message === 'Network Error' ||
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout') ||
      !error.response
    )) {
      config.retry += 1
      console.log(`Retrying request (${config.retry}/3)...`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000))
      
      return api(config)
    }
    
    console.error('API Error:', error)
    
    // Handle different error types
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || !error.response) {
      toast.error('Cannot connect to server. Please check your connection and try again.')
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else if (error.message) {
      toast.error(error.message)
    } else {
      toast.error('An unexpected error occurred. Please try again.')
    }
    
    return Promise.reject(error)
  }
)

export default api








