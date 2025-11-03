import api from './axios'

// Create a new post
export const createPost = async (postData) => {
  const formData = new FormData()
  
  formData.append('caption', postData.caption || '')
  if (postData.tags && postData.tags.length > 0) {
    formData.append('tags', postData.tags.join(','))
  }
  formData.append('privacy', postData.privacy || 'public')
  
  if (postData.location) {
    formData.append('location', JSON.stringify(postData.location))
  }
  
  if (postData.media && postData.media.length > 0) {
    postData.media.forEach(file => {
      formData.append('media', file)
    })
  }

  const response = await api.post('/api/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Get posts feed
export const getFeed = async (page = 1, limit = 10) => {
  const response = await api.get(`/api/posts/feed?page=${page}&limit=${limit}`)
  return response.data
}

// Get posts by profile
export const getProfilePosts = async (profileId, page = 1, limit = 10) => {
  const response = await api.get(`/api/posts/profile/${profileId}?page=${page}&limit=${limit}`)
  return response.data
}


// Add comment to post
export const addComment = async (postId, text, parentComment = null) => {
  const response = await api.post(`/api/posts/${postId}/comments`, {
    text,
    parentComment
  })
  return response.data
}

// Get comments for a post
export const getComments = async (postId, page = 1, limit = 20) => {
  const response = await api.get(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`)
  return response.data
}

// Share a post
export const sharePost = async (postId, caption = '', type = 'share') => {
  const response = await api.post(`/api/posts/${postId}/share`, {
    caption,
    type
  })
  return response.data
}

// Update a post
export const updatePost = async (postId, postData) => {
  const formData = new FormData()
  
  if (postData.caption !== undefined) {
    formData.append('caption', postData.caption)
  }
  if (postData.tags && postData.tags.length > 0) {
    formData.append('tags', postData.tags.join(','))
  }
  
  if (postData.media && postData.media.length > 0) {
    postData.media.forEach(file => {
      formData.append('media', file)
    })
  }

  const response = await api.put(`/api/posts/${postId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Delete a post
export const deletePost = async (postId) => {
  const response = await api.delete(`/api/posts/${postId}`)
  return response.data
}
