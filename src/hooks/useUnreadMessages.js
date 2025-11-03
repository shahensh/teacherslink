import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { chatApi } from '../api/chatApi'

export const useUnreadMessages = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  console.log('useUnreadMessages hook called, user:', user?.id, 'unreadCount:', unreadCount)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      console.log('No user, setting unread count to 0')
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log('Fetching conversations for user:', user.id)
      
      // Try to get unread count from conversations first
      try {
        const response = await chatApi.getConversations()
        console.log('Conversations response:', response)
        
        const conversations = response.conversations || []
        console.log('Conversations array:', conversations)
        
        // Calculate total unread count from all conversations
        const totalUnread = conversations.reduce((total, conv) => {
          const unread = conv.unreadCount || 0
          console.log(`Conversation ${conv.applicationId}: unreadCount = ${unread}`)
          return total + unread
        }, 0)
        
        console.log('Total unread messages count from conversations:', totalUnread)
        setUnreadCount(totalUnread)
      } catch (conversationsError) {
        console.log('Conversations endpoint failed, trying unread count endpoint:', conversationsError)
        
        // Fallback to dedicated unread count endpoint
        const unreadResponse = await chatApi.getUnreadCount()
        console.log('Unread count response:', unreadResponse)
        
        const unreadCount = unreadResponse.data?.unreadCount || 0
        console.log('Unread count from dedicated endpoint:', unreadCount)
        setUnreadCount(unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    fetchUnreadCount()
    
    // Set up periodic refresh every 30 seconds to ensure accuracy
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !user) return

    const handleNewMessage = (messageData) => {
      console.log('New message received, updating unread count:', messageData)
      
      // Check if the message is for the current user
      const isForCurrentUser = messageData.receiver === user.id || 
                              messageData.receiver?._id === user.id ||
                              messageData.receiver?.toString() === user.id
      
      if (isForCurrentUser) {
        // Increment unread count
        setUnreadCount(prev => prev + 1)
        console.log('Incremented unread count for new message')
      }
    }

    const handleMessageRead = (data) => {
      console.log('Message marked as read, updating unread count:', data)
      
      // Check if the read message is for the current user
      const isForCurrentUser = data.receiver === user.id || 
                              data.receiver?._id === user.id ||
                              data.receiver?.toString() === user.id
      
      if (isForCurrentUser) {
        // Decrement unread count (but don't go below 0)
        setUnreadCount(prev => Math.max(0, prev - 1))
        console.log('Decremented unread count for read message')
      }
    }

    // Listen for new messages
    socket.on('new_message', handleNewMessage)
    socket.on('message_read', handleMessageRead)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('message_read', handleMessageRead)
    }
  }, [socket, user])

  // Add a function to manually refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return

    try {
      // Try to get unread count from conversations first
      try {
        const response = await chatApi.getConversations()
        const conversations = response.conversations || []
        
        // Calculate total unread count from all conversations
        const totalUnread = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
        setUnreadCount(totalUnread)
        
        console.log('Manually refreshed unread messages count from conversations:', totalUnread)
      } catch (conversationsError) {
        console.log('Conversations endpoint failed, trying unread count endpoint for refresh:', conversationsError)
        
        // Fallback to dedicated unread count endpoint
        const unreadResponse = await chatApi.getUnreadCount()
        const unreadCount = unreadResponse.data?.unreadCount || 0
        setUnreadCount(unreadCount)
        
        console.log('Manually refreshed unread messages count from dedicated endpoint:', unreadCount)
      }
    } catch (error) {
      console.error('Error refreshing unread count:', error)
    }
  }, [user])

  return {
    unreadCount,
    isLoading,
    refreshUnreadCount
  }
}
