import api from './axios'

export const chatApi = {
  // Send a message
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/api/chat/messages', messageData)
      return response.data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // Get messages for a specific application
  getMessages: async (applicationId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/api/chat/messages/${applicationId}`, {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  },

  // Get user's conversations
  getConversations: async () => {
    try {
      const response = await api.get('/api/chat/conversations')
      return response.data
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.put(`/api/chat/messages/${messageId}/read`)
      return response.data
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/api/chat/messages/${messageId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/chat/unread-count')
      return response.data
    } catch (error) {
      console.error('Error fetching unread count:', error)
      throw error
    }
  },

  // Delete conversation
  deleteConversation: async (applicationId) => {
    try {
      const response = await api.delete(`/api/chat/conversations/${applicationId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }
}

export default chatApi
