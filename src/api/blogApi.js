import api from './axios';

export const blogApi = {
  // Get all blogs (admin view)
  getAllBlogs: async (params = {}) => {
    const response = await api.get('/api/blogs/admin/all', { params });
    return response.data;
  },

  // Get published blogs (public)
  getPublishedBlogs: async (params = {}) => {
    const response = await api.get('/api/blogs', { params });
    return response.data;
  },

  // Get blog by ID
  getBlogById: async (id) => {
    const response = await api.get(`/api/blogs/${id}`);
    return response.data;
  },

  // Create new blog post
  createBlog: async (blogData) => {
    const response = await api.post('/api/blogs/admin', blogData);
    return response.data;
  },

  // Update blog post
  updateBlog: async (id, blogData) => {
    const response = await api.put(`/api/blogs/admin/${id}`, blogData);
    return response.data;
  },

  // Delete blog post
  deleteBlog: async (id) => {
    const response = await api.delete(`/api/blogs/admin/${id}`);
    return response.data;
  },

  // Toggle like on blog post
  toggleLike: async (id) => {
    const response = await api.post(`/api/blogs/${id}/like`);
    return response.data;
  },

  // Add comment to blog post
  addComment: async (id, content) => {
    const response = await api.post(`/api/blogs/${id}/comments`, { content });
    return response.data;
  },

  // Get blog statistics
  getBlogStats: async () => {
    const response = await api.get('/api/blogs/admin/stats');
    return response.data;
  },

  // Get featured blogs
  getFeaturedBlogs: async () => {
    const response = await api.get('/api/blogs/featured');
    return response.data;
  },

  // Get blogs by category
  getBlogsByCategory: async (category, params = {}) => {
    const response = await api.get(`/api/blogs/category/${category}`, { params });
    return response.data;
  },

  // Unread blog tracking
  getUnreadBlogCount: async () => {
    const response = await api.get('/api/blogs/unread-count');
    return response.data;
  },

  markBlogsAsRead: async (blogIds) => {
    const response = await api.post('/api/blogs/mark-read', { blogIds });
    return response.data;
  },

  markAllBlogsAsRead: async () => {
    const response = await api.post('/api/blogs/mark-all-read');
    return response.data;
  }
};

export default blogApi;
