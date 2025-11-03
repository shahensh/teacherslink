import api from './axios'

export const schoolPublicApi = {
  getSchoolBySlug: async (slug) => {
    const res = await api.get(`/api/public/schools/${slug}`)
    return res.data
  },
  getPosts: async (slug, page = 1, limit = 12) => {
    const res = await api.get(`/api/public/schools/${slug}/posts`, { params: { page, limit } })
    return res.data
  }
}

export default schoolPublicApi


