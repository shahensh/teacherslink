import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '../../api/analyticsApi'
import { applicationsApi } from '../../api/applicationsApi'
import { Eye, Download, CheckCircle, XCircle, Clock, RefreshCw, Filter, Search, Calendar, MessageSquare, Star, Users, TrendingUp, CalendarDays, Phone, Video, MapPin, ChevronDown, MoreVertical, CheckSquare, Square, Trash2, Send, FileText, UserCheck, AlertCircle, UserPlus, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSocialSocket } from '../../hooks/useSocialSocket'

const Applicants = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const { socket } = useSocialSocket()

  // ATS State Management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedApplications, setSelectedApplications] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCoverLetters, setExpandedCoverLetters] = useState([])

  // Fetch applications function
  const fetchApplications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
        // Try to get applications from the applications API first
        const resp = await applicationsApi.getSchoolApplications()
        
        if (resp.success && resp.data) {
        console.log('Applications data received:', resp.data)
        console.log('Sample applicant data:', resp.data[0])
        console.log('Sample job location:', resp.data[0]?.job?.location)
        console.log('Sample applicant address:', resp.data[0]?.applicant?.teacher?.personalInfo?.address)
        console.log('Sample applicant teacher profile:', resp.data[0]?.applicant?.teacher)
        console.log('Sample applicant personalInfo:', resp.data[0]?.applicant?.teacher?.personalInfo)
          setApplications(resp.data)
        } else {
          // Fallback to analytics API
          const analyticsResp = await analyticsApi.getSchoolAnalytics()
          const data = analyticsResp.data || analyticsResp
          const apps = data?.recentApplications || []
          setApplications(apps)
        }
      
      if (isRefresh) {
        toast.success('Applications refreshed')
        }
      } catch (e) {
        console.error('Failed to load applications:', e)
        // Try fallback
        try {
          const analyticsResp = await analyticsApi.getSchoolAnalytics()
          const data = analyticsResp.data || analyticsResp
          const apps = data?.recentApplications || []
          setApplications(apps)
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          setApplications([])
        toast.error('Failed to load applications')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) {
      setIsRealtimeConnected(false)
      return
    }

    // Track connection status
    const handleConnect = () => {
      console.log('Socket connected for real-time applications')
      setIsRealtimeConnected(true)
      socket.emit('join_school_applications')
    }

    const handleDisconnect = () => {
      console.log('Socket disconnected from real-time applications')
      setIsRealtimeConnected(false)
    }

    // Join school applications room
    socket.emit('join_school_applications')
    setIsRealtimeConnected(true)

    // Listen for application updates
    const handleApplicationUpdate = (data) => {
      console.log('Real-time application update received:', data)
      setApplications(prev => 
        prev.map(app => 
          app._id === data.applicationId 
            ? { 
                ...app, 
                ...(data.status && { status: data.status, reviewedAt: data.reviewedAt }),
                ...(data.messageCount !== undefined && { messageCount: data.messageCount }),
                ...(data.lastMessageAt && { lastMessageAt: data.lastMessageAt })
              }
            : app
        )
      )
      if (data.status) {
        toast.success(`Application status updated to ${data.status}`)
      }
    }

    // Listen for socket errors
    const handleSocketError = (error) => {
      console.error('Socket error:', error)
      toast.error(error.message || 'Socket connection error')
      setIsRealtimeConnected(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('application_updated', handleApplicationUpdate)
    socket.on('error', handleSocketError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('application_updated', handleApplicationUpdate)
      socket.off('error', handleSocketError)
    }
  }, [socket])

  // ATS Analytics and Filtering
      const analytics = useMemo(() => {
        const total = applications.length
        const submitted = applications.filter(app => app.status === 'submitted' || app.status === 'under-review').length
        const shortlisted = applications.filter(app => app.status === 'shortlisted').length
        const messaged = applications.filter(app => app.messageCount && app.messageCount > 0).length
        const rejected = applications.filter(app => app.status === 'rejected').length
        
        return {
          total,
          submitted,
          shortlisted,
          messaged,
          rejected,
          conversionRate: total > 0 ? Math.round((shortlisted / total) * 100) : 0,
          shortlistRate: total > 0 ? Math.round((shortlisted / total) * 100) : 0
        }
      }, [applications])

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let filtered = applications

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => {
        const name = app.applicant?.teacher?.personalInfo?.firstName + ' ' + app.applicant?.teacher?.personalInfo?.lastName || ''
        const email = app.applicant?.email || ''
        const jobTitle = app.job?.title || ''
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.job?._id === jobFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.appliedAt) - new Date(a.appliedAt)
        case 'oldest':
          return new Date(a.appliedAt) - new Date(b.appliedAt)
        case 'name':
          const nameA = a.applicant?.teacher?.personalInfo?.firstName || ''
          const nameB = b.applicant?.teacher?.personalInfo?.firstName || ''
          return nameA.localeCompare(nameB)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }, [applications, searchTerm, statusFilter, jobFilter, sortBy])

  // Get unique jobs for filter
  const uniqueJobs = useMemo(() => {
    const jobs = applications.map(app => app.job).filter(Boolean)
    return [...new Map(jobs.map(job => [job._id, job])).values()]
  }, [applications])

  // Refresh function
  const handleRefresh = () => {
    fetchApplications(true)
  }

  // Function to update application status
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingStatus(applicationId)
      
      // Use socket for real-time updates
      if (socket) {
        socket.emit('application_status_updated', {
          applicationId,
          newStatus
        })
      }
      
      // Also update via API for persistence
      const response = await applicationsApi.updateApplicationStatus(applicationId, {
        status: newStatus,
        updatedBy: 'school'
      })
      
      if (response.success) {
        // Update local state immediately
        setApplications(prev => 
          prev.map(app => 
            app._id === applicationId 
              ? { ...app, status: newStatus, updatedAt: new Date() }
              : app
          )
        )
        
        // Show success message
        const statusMessages = {
          'shortlisted': 'Applicant shortlisted successfully!',
          'rejected': 'Applicant rejected.',
          'interview-scheduled': 'Interview scheduled.',
          'interviewed': 'Interview completed.',
          'accepted': 'Applicant accepted!',
          'withdrawn': 'Application withdrawn.'
        }
        
        toast.success(statusMessages[newStatus] || 'Status updated successfully!')
        
        // Refresh applications to get latest data with teacher profiles
        setTimeout(() => {
          fetchApplications(true)
        }, 1000)
      } else {
        toast.error(response.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Function to view resume
  const handleViewResume = async (applicationId) => {
    try {
      console.log('Applicants - handleViewResume called with ID:', applicationId)
      
      // Find the application to get teacher ID
      const application = applications.find(app => app._id === applicationId)
      console.log('Applicants - Found application:', application)
      console.log('Applicants - Application applicant:', application?.applicant)
      console.log('Applicants - Application applicant teacher:', application?.applicant?.teacher)
      
      if (!application) {
        toast.error('Application not found')
        return
      }
      
      if (!application.applicant) {
        toast.error('Applicant data not found')
        return
      }
      
      if (!application.applicant.teacher) {
        // If teacher profile is not found, try to use the applicant's user ID directly
        console.log('Teacher profile not found, trying to use applicant user ID:', application.applicant._id)
        
        // Import resumeApi dynamically to avoid circular dependency
        const { resumeApi } = await import('../../api/resumeApi')
        
        // Try to view resume using the applicant's user ID
        const result = await resumeApi.viewTeacherResumePDF(application.applicant._id)
        if (!result.success) {
          toast.error('📄 This teacher hasn\'t created a resume yet. Please ask them to complete their profile.')
        }
        return
      }
      
      if (!application.applicant.teacher._id) {
        toast.error('Teacher ID not found')
      return
      }

      console.log('Applicants - Using teacher ID:', application.applicant.teacher._id)

      // Import resumeApi dynamically to avoid circular dependency
      const { resumeApi } = await import('../../api/resumeApi')
      
      // View teacher resume PDF
      const result = await resumeApi.viewTeacherResumePDF(application.applicant.teacher._id)
      if (!result.success) {
        toast.error('Failed to view resume')
      }
    } catch (error) {
      console.error('Error viewing resume:', error)
      toast.error('Failed to view resume: ' + error.message)
    }
  }

  // ATS Action Functions
  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApplications.map(app => app._id))
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedApplications.length === 0) {
      toast.error('Please select applications first')
      return
    }

    try {
      for (const applicationId of selectedApplications) {
        await updateApplicationStatus(applicationId, action)
      }
      setSelectedApplications([])
      toast.success(`${selectedApplications.length} applications updated to ${action}`)
    } catch (error) {
      toast.error('Failed to update applications')
    }
  }

  const handleScheduleInterview = (application) => {
    setSelectedApplication(application)
    setShowInterviewModal(true)
  }

  const handleInterviewSubmit = async () => {
    if (!interviewData.date || !interviewData.time) {
      toast.error('Please select date and time')
      return
    }

    try {
      const interviewDateTime = new Date(`${interviewData.date}T${interviewData.time}`)
      
      // Update application status to interview-scheduled and save interview details
      await updateApplicationStatus(selectedApplication._id, 'interview-scheduled')
      await saveInterviewDetails(selectedApplication._id, interviewData)
      
      // Send detailed interview notification to teacher
      await sendInterviewNotification(selectedApplication, interviewData)
      
      toast.success(`Interview scheduled for ${interviewData.date} at ${interviewData.time}. Teacher has been notified with all details.`)
      
      setShowInterviewModal(false)
      setInterviewData({
        date: '',
        time: '',
        type: 'video',
        location: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error scheduling interview:', error)
      toast.error('Failed to schedule interview')
    }
  }

  // Function to save interview details to database
  const saveInterviewDetails = async (applicationId, interviewDetails) => {
    try {
      const { applicationsApi } = await import('../../api/applicationsApi')
      
      const interviewData = {
        interview: {
          scheduledDate: new Date(`${interviewDetails.date}T${interviewDetails.time}`),
          interviewType: interviewDetails.type,
          location: interviewDetails.location || '',
          notes: interviewDetails.notes || ''
        }
      }
      
      await applicationsApi.updateApplication(applicationId, interviewData)
      console.log('Interview details saved successfully')
      
    } catch (error) {
      console.error('Error saving interview details:', error)
      // Don't throw error to prevent interview scheduling from failing
    }
  }

  // Function to send detailed interview notification
  const sendInterviewNotification = async (application, interviewDetails) => {
    try {
      const teacherId = application.applicant?._id || application.applicant?.user
      const teacherName = application.applicant?.teacher?.personalInfo?.firstName + ' ' + application.applicant?.teacher?.personalInfo?.lastName || 'Teacher'
      const jobTitle = application.job?.title || 'Position'
      const schoolName = application.school?.schoolName || 'School'
      
      // Format interview details
      const interviewDate = new Date(`${interviewDetails.date}T${interviewDetails.time}`)
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      
      // Create detailed notification message
      let notificationMessage = `🎉 Congratulations! You've been shortlisted for an interview!\n\n`
      notificationMessage += `📅 **Interview Details:**\n`
      notificationMessage += `• **Date:** ${formattedDate}\n`
      notificationMessage += `• **Time:** ${formattedTime}\n`
      notificationMessage += `• **Type:** ${interviewDetails.type === 'video' ? 'Video Call' : interviewDetails.type === 'phone' ? 'Phone Call' : 'In-Person Interview'}\n`
      
      if (interviewDetails.type === 'in-person' && interviewDetails.location) {
        notificationMessage += `• **Location:** ${interviewDetails.location}\n`
      }
      
      if (interviewDetails.notes) {
        notificationMessage += `• **Notes:** ${interviewDetails.notes}\n`
      }
      
      notificationMessage += `\n📋 **Job Details:**\n`
      notificationMessage += `• **Position:** ${jobTitle}\n`
      notificationMessage += `• **School:** ${schoolName}\n`
      
      notificationMessage += `\n💡 **Next Steps:**\n`
      if (interviewDetails.type === 'video') {
        notificationMessage += `• You will receive a video call link closer to the interview date\n`
      } else if (interviewDetails.type === 'phone') {
        notificationMessage += `• We will call you at the scheduled time\n`
        } else {
        notificationMessage += `• Please arrive 10 minutes early for the interview\n`
      }
      notificationMessage += `• Prepare to discuss your teaching experience and qualifications\n`
      notificationMessage += `• Bring copies of your resume and certificates\n`
      
      // Create notification data
      const notificationData = {
        userId: teacherId,
        type: 'interview',
        title: `🎉 Interview Scheduled - ${jobTitle} at ${schoolName}`,
        message: notificationMessage,
        data: {
          jobId: application.job?._id,
          schoolId: application.school?._id,
          applicationId: application._id,
          schoolName: schoolName,
          jobTitle: jobTitle,
          interviewDetails: {
            date: interviewDetails.date,
            time: interviewDetails.time,
            type: interviewDetails.type,
            location: interviewDetails.location,
            notes: interviewDetails.notes,
            formattedDate: formattedDate,
            formattedTime: formattedTime
          }
        }
      }
      
      // Send notification via API
      const { notificationApi } = await import('../../api/notificationApi')
      await notificationApi.createNotification(notificationData)
      
      console.log('Interview notification sent successfully:', notificationData)
      
    } catch (error) {
      console.error('Error sending interview notification:', error)
      // Don't throw error to prevent interview scheduling from failing
      toast.error('Interview scheduled but notification failed to send')
    }
  }

  const handleMessageTeacher = (application) => {
    const teacherId = application.applicant?.teacher?._id || application.applicant?._id
    const teacherName = application.applicant?.teacher?.personalInfo?.firstName + ' ' + application.applicant?.teacher?.personalInfo?.lastName || 'Teacher'
    const jobTitle = application.job?.title || 'Position'
    
    navigate('/school/chat', {
      state: {
        applicationId: application._id,
        teacherId: teacherId,
        teacherName: teacherName,
        jobTitle: jobTitle
      }
    })
  }

  // Function to hire a teacher
  const handleHireTeacher = async (application) => {
    if (!application) {
      toast.error('Application not found')
      return
    }

    const teacherName = application.applicant?.teacher?.personalInfo?.firstName + ' ' + application.applicant?.teacher?.personalInfo?.lastName || 'Teacher'
    const jobTitle = application.job?.title || 'Position'
    const schoolName = application.school?.schoolName || 'School'

    // Confirm hiring
    const confirmed = window.confirm(
      `Are you sure you want to hire ${teacherName} for the position of ${jobTitle}?\n\nThis will:\n• Mark the application as "Hired"\n• Send a notification to the teacher\n• Add them to your employees list`
    )

    if (!confirmed) return

    try {
      // Update application status to hired
      await updateApplicationStatus(application._id, 'hired')
      
      // Send hiring notification to teacher
      await sendHiringNotification(application)
      
      toast.success(`🎉 Congratulations! You have successfully hired ${teacherName} for ${jobTitle}!`)
      
    } catch (error) {
      console.error('Error hiring teacher:', error)
      toast.error('Failed to hire teacher. Please try again.')
    }
  }

  // Function to send hiring notification
  const sendHiringNotification = async (application) => {
    try {
      const teacherId = application.applicant?._id || application.applicant?.user
      const teacherName = application.applicant?.teacher?.personalInfo?.firstName + ' ' + application.applicant?.teacher?.personalInfo?.lastName || 'Teacher'
      const jobTitle = application.job?.title || 'Position'
      const schoolName = application.school?.schoolName || 'School'
      
      // Create hiring notification message
      let notificationMessage = `🎉 Congratulations! You've been hired!\n\n`
      notificationMessage += `📋 **Job Details:**\n`
      notificationMessage += `• **Position:** ${jobTitle}\n`
      notificationMessage += `• **School:** ${schoolName}\n`
      notificationMessage += `• **Status:** Hired\n\n`
      
      notificationMessage += `🎯 **Next Steps:**\n`
      notificationMessage += `• The school will contact you with onboarding details\n`
      notificationMessage += `• Prepare your documents for employment\n`
      notificationMessage += `• Check your email for official offer letter\n`
      notificationMessage += `• Contact the school if you have any questions\n\n`
      
      notificationMessage += `🌟 **Welcome to the team!**\n`
      notificationMessage += `We're excited to have you join ${schoolName} as a ${jobTitle}.`
      
      // Create notification data
      const notificationData = {
        userId: teacherId,
        type: 'hired',
        title: `🎉 You've been hired! - ${jobTitle} at ${schoolName}`,
        message: notificationMessage,
        data: {
          jobId: application.job?._id,
          schoolId: application.school?._id,
          applicationId: application._id,
          schoolName: schoolName,
          jobTitle: jobTitle,
          hiringDetails: {
            hiredAt: new Date().toISOString(),
            position: jobTitle,
            school: schoolName
          }
        }
      }
      
      // Send notification via API
      const { notificationApi } = await import('../../api/notificationApi')
      await notificationApi.createNotification(notificationData)
      
      console.log('Hiring notification sent successfully:', notificationData)
      
    } catch (error) {
      console.error('Error sending hiring notification:', error)
      // Don't throw error to prevent hiring from failing
      toast.error('Teacher hired but notification failed to send')
    }
  }

  // Toggle cover letter expansion
  const toggleCoverLetter = (applicationId) => {
    setExpandedCoverLetters(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  // Function to download resume
  const handleDownloadResume = async (applicationId, applicantEmail) => {
    try {
      console.log('Applicants - handleDownloadResume called with ID:', applicationId)
      
      // Find the application to get teacher ID
      const application = applications.find(app => app._id === applicationId)
      console.log('Applicants - Found application for download:', application)
      console.log('Applicants - Application applicant for download:', application?.applicant)
      console.log('Applicants - Application applicant teacher for download:', application?.applicant?.teacher)
      
      if (!application) {
        toast.error('Application not found')
        return
      }

      if (!application.applicant) {
        toast.error('Applicant data not found')
        return
      }
      
      if (!application.applicant.teacher) {
        // If teacher profile is not found, try to use the applicant's user ID directly
        console.log('Teacher profile not found for download, trying to use applicant user ID:', application.applicant._id)
        
        // Import resumeApi dynamically to avoid circular dependency
        const { resumeApi } = await import('../../api/resumeApi')
        
        // Try to download resume using the applicant's user ID
        const filename = `${application.applicant.email?.split('@')[0] || 'Teacher'}_Resume.pdf`
        const result = await resumeApi.downloadTeacherResumePDF(application.applicant._id, filename)
        if (!result.success) {
          toast.error('📄 This teacher hasn\'t created a resume yet. Please ask them to complete their profile.')
        } else {
          toast.success('Resume download started')
        }
        return
      }
      
      if (!application.applicant.teacher._id) {
        toast.error('Teacher ID not found')
        return
      }

      console.log('Applicants - Using teacher ID for download:', application.applicant.teacher._id)

      // Import resumeApi dynamically to avoid circular dependency
      const { resumeApi } = await import('../../api/resumeApi')
      
      // Download teacher resume PDF
      const filename = `${application.applicant.teacher.personalInfo?.firstName || 'Teacher'}_Resume.pdf`
      const result = await resumeApi.downloadTeacherResumePDF(application.applicant.teacher._id, filename)
      if (!result.success) {
        toast.error('Failed to download resume')
      } else {
        toast.success('Resume download started')
      }
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast.error('Failed to download resume: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading applications...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ATS Dashboard Header */}
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applicant Tracking System</h1>
            <p className="text-sm text-gray-600 mt-1">
              {analytics.total} {analytics.total === 1 ? 'application' : 'applications'} • {analytics.conversionRate}% conversion rate
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isRealtimeConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isRealtimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

            {/* ATS Analytics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-5 text-center shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.total}</div>
                <div className="text-xs sm:text-sm text-blue-100 font-medium mt-1">Total</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 sm:p-5 text-center shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.submitted}</div>
                <div className="text-xs sm:text-sm text-indigo-100 font-medium mt-1">New</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 sm:p-5 text-center shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.shortlisted}</div>
                <div className="text-xs sm:text-sm text-yellow-100 font-medium mt-1">Shortlisted</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-5 text-center shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.messaged}</div>
                <div className="text-xs sm:text-sm text-purple-100 font-medium mt-1">Messaged</div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 sm:p-5 text-center shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.rejected}</div>
                <div className="text-xs sm:text-sm text-red-100 font-medium mt-1">Rejected</div>
              </div>
            </div>

        {/* ATS Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                      <option value="all">All Statuses</option>
                      <option value="submitted">New</option>
                      <option value="under-review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Position</label>
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Jobs</option>
                  {uniqueJobs.map(job => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedApplications.length} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {selectedApplications.length === filteredApplications.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('shortlisted')}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-100 rounded-lg hover:bg-green-200"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Shortlist
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => setSelectedApplications([])}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        
      {/* Applications List */}
      <div className="bg-white rounded-lg shadow">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
            </p>
            <p className="text-gray-500 text-sm">
              {applications.length === 0 
                ? 'Applications will appear here when teachers apply to your job postings.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
      ) : (
        <div className="divide-y divide-gray-200">
            {filteredApplications.map(app => (
              <div key={app._id} className={`p-6 hover:bg-gray-50 transition-colors ${selectedApplications.includes(app._id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                {/* Selection Checkbox */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    <button
                      onClick={() => handleSelectApplication(app._id)}
                      className="flex items-center justify-center w-5 h-5"
                    >
                      {selectedApplications.includes(app._id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Mobile Layout */}
                  <div className="block md:hidden flex-1">
                    <div className="flex items-start space-x-4 mb-4">
                    <div className="flex-shrink-0">
                      {app.applicant?.teacher?.personalInfo?.profileImage ? (
                        <img
                          src={app.applicant.teacher.personalInfo.profileImage}
                          alt="Profile"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md ${app.applicant?.teacher?.personalInfo?.profileImage ? 'hidden' : ''}`}>
                        {app.applicant?.teacher?.personalInfo?.firstName ? app.applicant.teacher.personalInfo.firstName.charAt(0).toUpperCase() : 
                         app.applicant?.firstName ? app.applicant.firstName.charAt(0).toUpperCase() :
                         app.applicant?.email ? app.applicant.email.charAt(0).toUpperCase() : 'A'}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {app.applicant?.teacher?.personalInfo?.firstName && app.applicant?.teacher?.personalInfo?.lastName
                            ? `${app.applicant.teacher.personalInfo.firstName} ${app.applicant.teacher.personalInfo.lastName}`
                            : app.applicant?.teacher?.slug 
                            ? `@${app.applicant.teacher.slug}`
                            : app.applicant?.firstName && app.applicant?.lastName
                            ? `${app.applicant.firstName} ${app.applicant.lastName}`
                            : app.applicant?.email
                            ? app.applicant.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                            : 'Unknown Applicant'
                          }
                        </h3>
                        <span className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border">
                          Teacher
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-gray-500">{app.applicant?.email}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
                          </svg>
                          <span className="font-medium">{app.job?.title || 'Job Title'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                </div>
                  
                    {/* Cover Letter Section - Mobile */}
                    {app.coverLetter && (
                      <div className="mb-4">
                        <button
                          onClick={() => toggleCoverLetter(app._id)}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Cover Letter
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedCoverLetters.includes(app._id) ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedCoverLetters.includes(app._id) && (
                          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.coverLetter}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => handleViewResume(app._id)}
                        className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Resume
                      </button>
                      
                      <button
                        onClick={() => handleMessageTeacher(app)}
                        className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5" />
                        Message
                      </button>
                    </div>
                    
                    {/* Mobile Status Actions */}
                    {(app.status === 'submitted' || app.status === 'under-review') && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          onClick={() => updateApplicationStatus(app._id, 'shortlisted')}
                          disabled={updatingStatus === app._id}
                          className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          {updatingStatus === app._id ? 'Processing...' : 'Shortlist'}
                        </button>
                        
                        <button
                          onClick={() => updateApplicationStatus(app._id, 'rejected')}
                          disabled={updatingStatus === app._id}
                          className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  
                  <div className="flex justify-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                      app.status === 'submitted' || app.status === 'under-review'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : app.status === 'shortlisted'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : app.status === 'withdrawn'
                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {app.status}
                    </span>
                    {app.messageCount && app.messageCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {app.messageCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex items-start justify-between flex-1">
                  <div className="flex items-start space-x-6 flex-1">
                    <div className="flex-shrink-0">
                      {app.applicant?.teacher?.personalInfo?.profileImage ? (
                        <img
                          src={app.applicant.teacher.personalInfo.profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${app.applicant?.teacher?.personalInfo?.profileImage ? 'hidden' : ''}`}>
                        {app.applicant?.teacher?.personalInfo?.firstName ? app.applicant.teacher.personalInfo.firstName.charAt(0).toUpperCase() : 
                         app.applicant?.firstName ? app.applicant.firstName.charAt(0).toUpperCase() :
                         app.applicant?.email ? app.applicant.email.charAt(0).toUpperCase() : 'A'}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {app.applicant?.teacher?.personalInfo?.firstName && app.applicant?.teacher?.personalInfo?.lastName
                            ? `${app.applicant.teacher.personalInfo.firstName} ${app.applicant.teacher.personalInfo.lastName}`
                            : app.applicant?.teacher?.slug 
                            ? `@${app.applicant.teacher.slug}`
                            : app.applicant?.firstName && app.applicant?.lastName
                            ? `${app.applicant.firstName} ${app.applicant.lastName}`
                            : app.applicant?.email
                            ? app.applicant.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                            : 'Unknown Applicant'
                          }
                        </h3>
                        <span className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border">
                          Teacher
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-gray-500">{app.applicant?.email}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
                          </svg>
                          <span className="font-medium">{app.job?.title || 'Job Title'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2.5 ml-6">
                    {app.coverLetter && (
                      <button
                        onClick={() => toggleCoverLetter(app._id)}
                        className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Cover Letter
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expandedCoverLetters.includes(app._id) ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleViewResume(app._id)}
                      className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Resume
                    </button>
                    
                    <button
                      onClick={() => handleMessageTeacher(app)}
                      className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </button>
                      
                    {(app.status === 'submitted' || app.status === 'under-review') && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(app._id, 'shortlisted')}
                          disabled={updatingStatus === app._id}
                          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {updatingStatus === app._id ? 'Processing...' : 'Shortlist'}
                        </button>
                        
                        <button
                          onClick={() => updateApplicationStatus(app._id, 'rejected')}
                          disabled={updatingStatus === app._id}
                          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    
                    <div className="pt-2 flex flex-col gap-2">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                      app.status === 'submitted' || app.status === 'under-review'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : app.status === 'shortlisted'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : app.status === 'rejected'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                        : app.status === 'withdrawn'
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {app.status}
                    </span>
                    {app.messageCount && app.messageCount > 0 && (
                      <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {app.messageCount} {app.messageCount === 1 ? 'Message' : 'Messages'}
                      </span>
                    )}
                    </div>
                  </div>
                  </div>
                </div>
                
                {/* Cover Letter Expanded Content - Desktop */}
                {expandedCoverLetters.includes(app._id) && app.coverLetter && (
                  <div className="mt-4 pl-28 pr-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.coverLetter}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  )
}

export default Applicants