import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

export const useSocialSocket = () => {
  const { socket, isConnected } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // Listen for real-time events
  useEffect(() => {
    if (!socket || !isConnected) return

    // New post in feed
    const handleNewPost = (data) => {
      console.log('New post received:', data)
      // You can emit a custom event or update state here
      window.dispatchEvent(new CustomEvent('newPost', { detail: data }))
    }

    // Post liked
    const handlePostLiked = (data) => {
      console.log('Post liked:', data)
      window.dispatchEvent(new CustomEvent('postLiked', { detail: data }))
    }

    // Post commented
    const handlePostCommented = (data) => {
      console.log('Post commented:', data)
      window.dispatchEvent(new CustomEvent('postCommented', { detail: data }))
    }

    // Post shared
    const handlePostShared = (data) => {
      console.log('Post shared:', data)
      window.dispatchEvent(new CustomEvent('postShared', { detail: data }))
    }

    // Image uploaded
    const handleImageUploaded = (data) => {
      console.log('Image uploaded:', data)
      window.dispatchEvent(new CustomEvent('imageUploaded', { detail: data }))
    }

    // Notifications
    const handleNotification = (data) => {
      console.log('Notification received:', data)
      setNotifications(prev => [...prev, data])
      toast.success(data.message)
    }

    // User typing comment
    const handleUserTypingComment = (data) => {
      console.log('User typing comment:', data)
      window.dispatchEvent(new CustomEvent('userTypingComment', { detail: data }))
    }

    // User status changed
    const handleUserStatusChanged = (data) => {
      console.log('User status changed:', data)
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        if (data.status === 'online') {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
    }

    // Register event listeners
    socket.on('new_post', handleNewPost)
    socket.on('post_liked', handlePostLiked)
    socket.on('post_commented', handlePostCommented)
    socket.on('post_shared', handlePostShared)
    socket.on('image_uploaded', handleImageUploaded)
    socket.on('notification', handleNotification)
    socket.on('user_typing_comment', handleUserTypingComment)
    socket.on('user_status_changed', handleUserStatusChanged)

    // Cleanup
    return () => {
      socket.off('new_post', handleNewPost)
      socket.off('post_liked', handlePostLiked)
      socket.off('post_commented', handlePostCommented)
      socket.off('post_shared', handlePostShared)
      socket.off('image_uploaded', handleImageUploaded)
      socket.off('notification', handleNotification)
      socket.off('user_typing_comment', handleUserTypingComment)
      socket.off('user_status_changed', handleUserStatusChanged)
    }
  }, [socket, isConnected])

  // Join post room for real-time updates
  const joinPostRoom = useCallback((postId) => {
    if (socket && isConnected) {
      socket.emit('join_post', postId)
    }
  }, [socket, isConnected])

  // Leave post room
  const leavePostRoom = useCallback((postId) => {
    if (socket && isConnected) {
      socket.emit('leave_post', postId)
    }
  }, [socket, isConnected])

  // Send typing indicator
  const sendTypingIndicator = useCallback((postId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing_comment', { postId, isTyping })
    }
  }, [socket, isConnected])

  // Set online status
  const setOnlineStatus = useCallback((status) => {
    if (socket && isConnected) {
      socket.emit('set_online_status', status)
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    notifications,
    onlineUsers,
    joinPostRoom,
    leavePostRoom,
    sendTypingIndicator,
    setOnlineStatus
  }
}

