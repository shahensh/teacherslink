import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { chatApi } from '../../api/chatApi'
import { applicationsApi } from '../../api/applicationsApi'
import { useUnreadMessages } from '../../hooks/useUnreadMessages'
import { formatMessageText } from '../../utils/textUtils.jsx'
import { 
  Send, 
  Paperclip, 
  Smile, 
  ArrowLeft, 
  MoreVertical, 
  Info,
  Check,
  CheckCheck,
  Clock,
  User,
  Building,
  MessageCircle,
  AlertCircle,
  Trash2,
  X,
  CheckSquare,
  Square
} from 'lucide-react'
import toast from 'react-hot-toast'

const ChatRoom = () => {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { socket } = useSocket()
  const { refreshUnreadCount } = useUnreadMessages()
  
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedChats, setSelectedChats] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Memoized load data function
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load conversations and get the data directly
      console.log('ChatRoom - Loading conversations...');
      const conversationsResp = await chatApi.getConversations();
      console.log('ChatRoom - Conversations response:', conversationsResp);
      
      const conversationsData = conversationsResp.conversations || [];
      setConversations(conversationsData);
      
          // Calculate total unread count
          const totalUnread = conversationsData.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
          
          // Refresh sidebar unread count
          refreshUnreadCount();
      
      console.log('ChatRoom - Conversations loaded successfully:', conversationsData.length);
      
      // Check if we have navigation state from applications page
      const navigationState = location.state
      let targetApplicationId = applicationId
      
      // If coming from applications page, find the conversation by applicationId
      if (navigationState?.applicationId) {
        targetApplicationId = navigationState.applicationId
        const conversation = conversationsData.find(
          conv => conv.applicationId === navigationState.applicationId
        )
        if (conversation) {
          setSelectedConversation(conversation)
          await loadMessages(navigationState.applicationId)
        } else {
          // If conversation doesn't exist yet, create a placeholder
          const placeholderConversation = {
            applicationId: navigationState.applicationId,
            schoolName: navigationState.schoolName,
            teacherName: user?.name || 'Teacher',
            jobTitle: navigationState.jobTitle,
            lastMessage: 'Start a conversation...',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
          }
          setSelectedConversation(placeholderConversation)
          setMessages([]) // No messages yet
        }
      } else if (navigationState?.createNewConversation) {
        // If creating a new conversation with a school (from school profile)
        console.log('ChatRoom - Creating new conversation with navigation state:', navigationState)
        console.log('ChatRoom - School name from navigation state:', navigationState.schoolName)
        console.log('ChatRoom - School ID from navigation state:', navigationState.schoolId)
        
        // Check if a conversation with this school already exists
        const existingConversation = conversationsData.find(conv => {
          const convSchoolId = conv.schoolId || conv.applicationId?.split('_')[1];
          return convSchoolId === navigationState.schoolId;
        });
        
        if (existingConversation) {
          console.log('ChatRoom - Found existing conversation, using it instead:', existingConversation);
          
          // If school name is missing, try to fetch it
          if (!existingConversation.schoolName && navigationState.schoolId) {
            try {
              console.log('ChatRoom - School name missing from existing conversation, fetching...');
              const { schoolApi } = await import('../../api/schoolApi');
              const schoolResponse = await schoolApi.getProfileById(navigationState.schoolId);
              if (schoolResponse.success && schoolResponse.school.schoolName) {
                existingConversation.schoolName = schoolResponse.school.schoolName;
                console.log('ChatRoom - Updated existing conversation with school name:', schoolResponse.school.schoolName);
              }
            } catch (error) {
              console.error('ChatRoom - Error fetching school name for existing conversation:', error);
            }
          }
          
          setSelectedConversation(existingConversation);
          
          // Update the conversations list with the updated school name
          setConversations(prev => prev.map(conv => 
            conv.applicationId === existingConversation.applicationId 
              ? existingConversation 
              : conv
          ));
          
          await loadMessages(existingConversation.applicationId);
          return;
        }
        
        const placeholderConversation = {
          applicationId: `new_${navigationState.schoolId}_${Date.now()}`, // Generate a temporary ID
          schoolName: navigationState.schoolName || 'School',
          teacherName: user?.name || 'Teacher',
          jobTitle: 'General Inquiry',
          lastMessage: navigationState.message || 'Start a conversation...',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          isNewConversation: true,
          schoolId: navigationState.schoolId
        }
        
        console.log('ChatRoom - Placeholder conversation created:', placeholderConversation)
        console.log('ChatRoom - School name in placeholder:', placeholderConversation.schoolName)
        
        // If school name is missing, try to fetch it
        if (!navigationState.schoolName && navigationState.schoolId) {
          try {
            console.log('ChatRoom - School name missing, fetching school details...')
            const { schoolApi } = await import('../../api/schoolApi')
            const schoolResponse = await schoolApi.getProfileById(navigationState.schoolId)
            if (schoolResponse.success && schoolResponse.school.schoolName) {
              placeholderConversation.schoolName = schoolResponse.school.schoolName
              console.log('ChatRoom - Fetched school name:', schoolResponse.school.schoolName)
            }
          } catch (error) {
            console.error('ChatRoom - Error fetching school details:', error)
          }
        }
        
        setSelectedConversation(placeholderConversation)
        setMessages([]) // No messages yet
        
        // Add the placeholder conversation to the conversations list
        setConversations(prev => [placeholderConversation, ...prev])
        
        console.log('ChatRoom - Conversation added to list and selected')
      } else if (applicationId) {
        // If applicationId is provided via URL params, load that conversation
        const conversation = conversationsData.find(
          conv => conv.applicationId === applicationId
        )
        if (conversation) {
          setSelectedConversation(conversation)
          await loadMessages(applicationId)
        }
      } else {
        // Don't auto-select any conversation - let user choose from the list
        console.log('ChatRoom - No specific conversation to load, showing conversation list');
      }
      
    } catch (error) {
      console.error('Error loading chat data:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      })
      toast.error('Failed to load chat data')
    } finally {
      setIsLoading(false)
    }
  }, [applicationId, location.state, user?.name]);

  // Load conversations and messages
  useEffect(() => {
    loadData()
    
    // Refresh unread count when chat page loads
    setTimeout(() => {
      refreshUnreadCount()
    }, 2000) // Delay to ensure conversations are loaded first
  }, [loadData, refreshUnreadCount])

  // Socket.IO event handlers
  useEffect(() => {
    if (socket) {
      // Join application room when conversation is selected
      if (selectedConversation) {
        socket.emit('join_application', selectedConversation.applicationId)
      }

      // Listen for new messages
      const handleNewMessage = (data) => {
        console.log('ChatRoom - Received new message:', data);
        if (data.applicationId === selectedConversation?.applicationId) {
          setMessages(prev => [...prev, data.message])
        }
        // Update conversations list to show new message
        loadConversations();
      }

      // Listen for message sent confirmation
      const handleMessageSent = (data) => {
        console.log('ChatRoom - Message sent confirmation:', data);
        if (data.applicationId === selectedConversation?.applicationId) {
          setMessages(prev => [...prev, data.message])
        }
        // Update conversations list
        loadConversations();
      }

      // Listen for typing indicators
      const handleTyping = (data) => {
        if (data.applicationId === selectedConversation?.applicationId && data.userId !== user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId)
            return [...filtered, { userId: data.userId, name: data.name }]
          })
          
          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId))
          }, 3000)
        }
      }

      // Listen for message read status
      const handleMessageRead = (data) => {
        if (data.applicationId === selectedConversation?.applicationId) {
          setMessages(prev => 
            prev.map(msg => 
              msg._id === data.messageId ? { ...msg, isRead: true, readAt: data.readAt } : msg
            )
          )
        }
      }

      socket.on('new_message', handleNewMessage)
      socket.on('message_sent', handleMessageSent)
      socket.on('user_typing', handleTyping)
      socket.on('messages_read', handleMessageRead)

      return () => {
        socket.off('new_message', handleNewMessage)
        socket.off('message_sent', handleMessageSent)
        socket.off('user_typing', handleTyping)
        socket.off('messages_read', handleMessageRead)
      }
    }
  }, [socket, selectedConversation, user])

  // Memoized function to load conversations
  const loadConversations = useCallback(async () => {
    try {
      console.log('ChatRoom - Loading conversations...');
      const conversationsResp = await chatApi.getConversations();
      console.log('ChatRoom - Conversations response:', conversationsResp);
      
      setConversations(conversationsResp.conversations || []);
      
      // Calculate total unread count
      const totalUnread = conversationsResp.conversations?.reduce((total, conv) => total + (conv.unreadCount || 0), 0) || 0;
      setUnreadCount(totalUnread);
      
      console.log('ChatRoom - Conversations loaded successfully:', conversationsResp.conversations?.length || 0);
    } catch (error) {
      console.error('ChatRoom - Error loading conversations:', error);
      console.error('ChatRoom - Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Don't throw error here since it's used in socket handlers
    }
  }, []);

  const loadMessages = async (appId) => {
    try {
      console.log('Loading messages for application:', appId)
      const response = await chatApi.getMessages(appId)
      console.log('Messages response:', response)
      setMessages(response.messages || [])
      console.log('Messages set:', response.messages?.length || 0)
      
      // Refresh unread count after loading messages (they get marked as read)
      refreshUnreadCount()
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || isSending) return

    try {
      setIsSending(true)
      
      let actualApplicationId = selectedConversation.applicationId
      
      // If this is a new conversation, we need to create an application first
      if (selectedConversation.isNewConversation) {
        try {
          // First, check if there's already an application between this teacher and school
          const { applicationsApi } = await import('../../api/applicationsApi');
          const applicationsResponse = await applicationsApi.getApplications();
          
          console.log('Applications response:', applicationsResponse);
          
          // Extract applications array from response
          const existingApplications = applicationsResponse.data || applicationsResponse.applications || applicationsResponse || [];
          
          console.log('Existing applications array:', existingApplications);
          console.log('Is array?', Array.isArray(existingApplications));
          
          // Ensure we have an array
          if (!Array.isArray(existingApplications)) {
            console.error('Applications response is not an array:', existingApplications);
            throw new Error('Invalid applications response format');
          }
          
          // Look for existing application with this school
          const existingApplication = existingApplications.find(app => 
            app.school._id === selectedConversation.schoolId || 
            app.school === selectedConversation.schoolId
          );

          if (existingApplication) {
            // Use existing application
            actualApplicationId = existingApplication._id;
            console.log('Using existing application for conversation:', existingApplication._id);
            
            // Update the selected conversation with the existing application ID
            setSelectedConversation(prev => ({
              ...prev,
              applicationId: actualApplicationId,
              isNewConversation: false
            }));
          } else {
            // Create a new general inquiry application
            const applicationData = {
              school: selectedConversation.schoolId,
              job: null, // No specific job for general inquiry
              coverLetter: `General inquiry from teacher about opportunities at ${selectedConversation.schoolName}`,
              resume: null
            }
            
            const newApplication = await applicationsApi.createApplication(applicationData)
            actualApplicationId = newApplication.application._id
            
            console.log('Created new application for conversation:', newApplication)
            
            // Update the selected conversation with the real application ID
            setSelectedConversation(prev => ({
              ...prev,
              applicationId: actualApplicationId,
              isNewConversation: false
            }))
          }
          
        } catch (error) {
          console.error('Error creating application for new conversation:', error)
          toast.error('Failed to start conversation. Please try again.')
          return
        }
      }
      
      const messageData = {
        applicationId: actualApplicationId,
        message: newMessage.trim(),
        messageType: 'text'
      }

      console.log('Frontend - Sending message with data:', {
        applicationId: actualApplicationId,
        message: newMessage.trim(),
        selectedConversation: selectedConversation,
        user: user
      })

      // Send via Socket.IO for real-time delivery
      if (socket) {
        socket.emit('send_message', messageData)
      }

      // Also send via API for persistence
      const apiResponse = await chatApi.sendMessage(messageData)
      console.log('Message sent via API:', apiResponse)
      
      setNewMessage('')
      
          // Refresh conversations list after sending message
          await loadConversations()

          // If this was a placeholder conversation, find the newly created conversation
          const conversationsResp = await chatApi.getConversations()
          const newConversation = conversationsResp.conversations?.find(
            conv => conv.applicationId === actualApplicationId
          )
          if (newConversation) {
            setSelectedConversation(newConversation)
            // Reload messages for the updated conversation
            await loadMessages(actualApplicationId)
          }

          // Refresh unread count after sending message
          setTimeout(() => {
            refreshUnreadCount()
          }, 500)
      
      // Stop typing indicator
      if (socket) {
        socket.emit('typing_stop', { applicationId: actualApplicationId })
      }
      setIsTyping(false)
      
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (socket && selectedConversation) {
      // Start typing indicator
      if (!isTyping) {
        socket.emit('typing_start', { 
          applicationId: selectedConversation.applicationId,
          name: user?.firstName || 'User'
        })
        setIsTyping(true)
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { applicationId: selectedConversation.applicationId })
        setIsTyping(false)
      }, 2000)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Handle file upload logic here
      toast.info('File upload feature coming soon!')
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getMessageStatus = useCallback((message) => {
    const senderId = message.sender?._id?.toString();
    const userId = user?.id?.toString();
    const isOwnMessage = senderId === userId;
    
    if (isOwnMessage) {
      if (message.isRead) {
        return <CheckCheck className="w-4 h-4 text-blue-100" />
      } else {
        return <Check className="w-4 h-4 text-blue-200" />
      }
    }
    return null
  }, [user?.id]);

  // Helper function to get sender display name
  const getSenderDisplayName = (sender) => {
    if (!sender) return 'Unknown';
    
    // Use teacherName if available (from backend)
    if (sender.teacherName) {
      return sender.teacherName;
    }
    
    // Fallback to role
    return sender.role === 'teacher' ? 'Teacher' : 'School';
  };

  // Memoized messages for better performance
  const memoizedMessages = useMemo(() => {
    return messages
      .filter(message => message && message.sender && message.sender._id)
      .map((message) => {
        const senderId = message.sender?._id?.toString();
        const userId = user?.id?.toString();
        const isOwnMessage = senderId === userId;
        const senderDisplayName = getSenderDisplayName(message.sender);
        
        return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {!isOwnMessage && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {senderDisplayName}
                  </span>
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm break-words">
                  {formatMessageText(message.message, isOwnMessage)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </span>
                  {getMessageStatus(message)}
                </div>
              </div>
            </div>
          </div>
        );
      });
  }, [messages, user?.id, getMessageStatus]);

  const selectConversation = async (conversation) => {
    if (isSelectMode) {
      // Toggle selection in select mode
      toggleChatSelection(conversation.applicationId)
    } else {
      // Normal conversation selection
      setSelectedConversation(conversation)
      await loadMessages(conversation.applicationId)
      
      // Refresh unread count after selecting conversation (messages get marked as read)
      setTimeout(() => {
        refreshUnreadCount()
      }, 1000) // Small delay to ensure messages are marked as read
    }
  }

  // Chat management functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedChats([])
    if (isSelectMode) {
      setSelectedConversation(null)
    }
  }

  const toggleChatSelection = (applicationId) => {
    setSelectedChats(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const selectAllChats = () => {
    setSelectedChats(conversations.map(conv => conv.applicationId))
  }

  const deselectAllChats = () => {
    setSelectedChats([])
  }

  const deleteSelectedChats = async () => {
    if (selectedChats.length === 0) return

    try {
      setIsDeleting(true)
      
      // Delete each selected conversation
      const deletePromises = selectedChats.map(applicationId => 
        chatApi.deleteConversation(applicationId)
      )
      
      await Promise.all(deletePromises)
      
      // Refresh conversations list
      await loadConversations()
      
      // Clear selections
      setSelectedChats([])
      setIsSelectMode(false)
      
      toast.success(`Successfully deleted ${selectedChats.length} conversation(s)`)
      
    } catch (error) {
      console.error('Error deleting conversations:', error)
      toast.error('Failed to delete conversations')
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="h-[calc(100vh-8rem)] bg-gray-50">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Conversations Sidebar Skeleton */}
        <div className="lg:w-1/3 bg-white border-r border-gray-200 flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area Skeleton */}
        <div className="flex-1 flex-col h-full flex">
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'
                } animate-pulse`}>
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-gray-50">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} lg:w-1/3 bg-white border-r border-gray-200 flex-col h-full`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleSelectMode}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title={isSelectMode ? "Exit selection mode" : "Select conversations"}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start by applying to jobs!</p>
              </div>
            ) : (
              <>
                {/* Selection Mode Header */}
                {isSelectMode && (
                  <div className="p-3 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedChats.length} selected
                        </span>
                        <button
                          onClick={selectedChats.length === conversations.length ? deselectAllChats : selectAllChats}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {selectedChats.length === conversations.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedChats.length > 0 && (
                          <button
                            onClick={deleteSelectedChats}
                            disabled={isDeleting}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        )}
                        <button
                          onClick={toggleSelectMode}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                    {conversations.map((conversation) => {
                      console.log('ChatRoom - Rendering conversation:', {
                        applicationId: conversation.applicationId,
                        schoolName: conversation.schoolName,
                        teacherName: conversation.teacherName,
                        jobTitle: conversation.jobTitle
                      });
  return (
                      <div
                        key={conversation.applicationId}
                        onClick={() => selectConversation(conversation)}
                        className={`p-3 lg:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?.applicationId === conversation.applicationId && !isSelectMode
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : ''
                        } ${
                          isSelectMode && selectedChats.includes(conversation.applicationId)
                            ? 'bg-blue-100 border-l-4 border-l-blue-500'
                            : ''
                        }`}
                      >
                  <div className="flex items-start space-x-2 lg:space-x-3">
                    {/* Selection Checkbox */}
                    {isSelectMode && (
                      <div className="flex items-center justify-center w-5 h-5 mt-1">
                        {selectedChats.includes(conversation.applicationId) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}
                    
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {user?.role === 'teacher' ? (
                        <Building className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user?.role === 'teacher' ? (conversation.schoolName || 'School') : (conversation.teacherName || 'Teacher')}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs lg:text-sm text-gray-600 truncate mt-1">
                        {conversation.jobTitle === 'General Inquiry' ? 'General Inquiry' : `Job: ${conversation.jobTitle || 'Position Not Specified'}`}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 truncate">
                        {formatMessageText(conversation.lastMessage, false)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {conversation.unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                      );
                    })}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col h-full ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedConversation(null)
                        navigate(user?.role === 'teacher' ? '/teacher/chat' : '/school/chat')
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full lg:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {user?.role === 'teacher' ? (
                        <Building className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                            {user?.role === 'teacher' ? (selectedConversation.schoolName || 'School') : (selectedConversation.teacherName || 'Teacher')}
                          </h2>
                          <p className="text-xs lg:text-sm text-gray-600 truncate">
                            {selectedConversation.jobTitle === 'General Inquiry' ? 'General Inquiry' : selectedConversation.jobTitle || 'Position Not Specified'}
                          </p>
                          {user?.role === 'school' && selectedConversation.teacherName && (
                            <p className="text-xs text-gray-500 truncate">
                              Teacher: {selectedConversation.teacherName}
                            </p>
                          )}
                        </div>
                  </div>
                  <div className="flex items-center space-x-1 lg:space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                      <Info className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  memoizedMessages
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {typingUsers.map(u => u.name).join(', ')} typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-3 lg:p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 lg:space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={isSending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State - No Conversation Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatRoom