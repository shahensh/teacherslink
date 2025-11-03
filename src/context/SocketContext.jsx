import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001'

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        }
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        toast.error('Connection error. Please refresh the page.')
      })

      // Listen for message notifications
      newSocket.on('message_notification', (data) => {
        toast.success(`New message: ${data.message}`)
      })

      // Listen for user status changes
      newSocket.on('user_status_change', (data) => {
        console.log('User status changed:', data)
      })

      // Join job feed for teachers
      if (user.role === 'teacher') {
        newSocket.emit('join_job_feed')
      }

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, token, user])

  const joinApplication = (applicationId) => {
    if (socket && isConnected) {
      socket.emit('join_application', applicationId)
    }
  }

  const sendMessage = (data) => {
    if (socket && isConnected) {
      socket.emit('send_message', data)
    }
  }

  const startTyping = (applicationId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { applicationId })
    }
  }

  const stopTyping = (applicationId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { applicationId })
    }
  }

  const markMessagesRead = (applicationId) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', { applicationId })
    }
  }

  const value = {
    socket,
    isConnected,
    joinApplication,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesRead
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext





