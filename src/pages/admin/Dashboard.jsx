import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { adminApi } from '../../api/adminApi'
import { Users, Building, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [stats, setStats] = useState(null)
  const [recentData, setRecentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false) // Disabled by default since we have real-time

  const fetchDashboardData = async () => {
    try {
      const response = await adminApi.getDashboardStats()
      if (response.success) {
        setStats(response.stats)
        setRecentData(response.recent)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Real-time updates via sockets
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleUserRegistered = (userData) => {
      console.log('New user registered:', userData)
      setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers + 1 } : prev)
      setRecentData(prev => prev ? {
        ...prev,
        users: [userData, ...(prev.users || [])].slice(0, 5)
      } : prev)
      toast.success(`New ${userData.role} registered: ${userData.email}`)
      setLastUpdated(new Date())
    }

    const handleJobCreated = (jobData) => {
      console.log('New job created:', jobData)
      setStats(prev => prev ? { 
        ...prev, 
        activeJobs: prev.activeJobs + 1,
        totalJobs: prev.totalJobs + 1
      } : prev)
      setRecentData(prev => prev ? {
        ...prev,
        jobs: [jobData, ...(prev.jobs || [])].slice(0, 5)
      } : prev)
      setLastUpdated(new Date())
    }

    const handleJobDeleted = (jobId) => {
      console.log('Job deleted:', jobId)
      setStats(prev => prev ? { 
        ...prev, 
        activeJobs: Math.max(0, prev.activeJobs - 1),
        totalJobs: Math.max(0, prev.totalJobs - 1)
      } : prev)
      setRecentData(prev => prev ? {
        ...prev,
        jobs: (prev.jobs || []).filter(job => job._id !== jobId)
      } : prev)
      setLastUpdated(new Date())
    }

    const handleApplicationSubmitted = (appData) => {
      console.log('New application submitted:', appData)
      setStats(prev => prev ? { 
        ...prev, 
        totalApplications: prev.totalApplications + 1
      } : prev)
      setLastUpdated(new Date())
    }

    const handleSchoolVerified = (schoolData) => {
      console.log('School verified:', schoolData)
      setStats(prev => prev ? { 
        ...prev, 
        totalSchools: prev.totalSchools + 1,
        pendingVerifications: Math.max(0, prev.pendingVerifications - 1)
      } : prev)
      toast.success(`School verified: ${schoolData.schoolName}`)
      setLastUpdated(new Date())
    }

    // Register all event listeners
    socket.on('user_registered', handleUserRegistered)
    socket.on('new_job_posted', handleJobCreated)
    socket.on('job_deleted', handleJobDeleted)
    socket.on('application_submitted', handleApplicationSubmitted)
    socket.on('school_verified', handleSchoolVerified)

    return () => {
      socket.off('user_registered', handleUserRegistered)
      socket.off('new_job_posted', handleJobCreated)
      socket.off('job_deleted', handleJobDeleted)
      socket.off('application_submitted', handleApplicationSubmitted)
      socket.off('school_verified', handleSchoolVerified)
    }
  }, [socket, isConnected])

  // Fallback polling only when auto-refresh is manually enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'teacher': return 'text-blue-600 bg-blue-100'
      case 'school': return 'text-green-600 bg-green-100'
      case 'admin': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%'
    },
    {
      name: 'Registered Schools',
      value: stats?.totalSchools || 0,
      icon: Building,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%'
    },
    {
      name: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+15%'
    },
    {
      name: 'Total Applications',
      value: stats?.totalApplications || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+22%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          {/* Title Section */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Welcome to the Teachers Link administration panel.
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Real-time status indicator */}
              <div className={`flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="h-3 w-3 sm:h-4 sm:w-4" /> : <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                <span>{isConnected ? 'Live' : 'Offline'}</span>
              </div>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                  autoRefresh 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Enable/disable 30-second polling"
              >
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${autoRefresh ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                <span className="hidden sm:inline">Polling {autoRefresh ? 'ON' : 'OFF'}</span>
                <span className="sm:hidden">Poll {autoRefresh ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={fetchDashboardData}
                className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-xs sm:text-sm text-gray-500">
                Updated: {formatDate(lastUpdated)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentData?.users?.map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Job Postings</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentData?.jobs?.map((job, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.school?.schoolName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard


