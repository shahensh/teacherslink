import api from './axios'

export const searchApi = {
  // Search for profiles (teachers and schools)
  searchProfiles: async (query, page = 1, limit = 10) => {
    const response = await api.get('/api/search/profiles', {
      params: { q: query, page, limit }
    })
    return response.data
  },

  // Get search suggestions (for autocomplete)
  getSuggestions: async (query) => {
    const response = await api.get('/api/search/suggestions', {
      params: { q: query }
    })
    return response.data
  },

  // Search teachers only
  searchTeachers: async (query, page = 1, limit = 10) => {
    const response = await api.get('/api/search/teachers', {
      params: { q: query, page, limit }
    })
    return response.data
  },

  // Search schools only
  searchSchools: async (query, page = 1, limit = 10) => {
    const response = await api.get('/api/search/schools', {
      params: { q: query, page, limit }
    })
    return response.data
  }
}

