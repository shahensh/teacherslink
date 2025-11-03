import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { analyticsApi } from '../../api/analyticsApi'
import { 
  Plus, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp,
  Building,
  CheckCircle
} from 'lucide-react'

const SchoolDashboard = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [overview, setOverview] = useState({ totalJobs: 0, activeJobs: 0, totalViews: 0, totalApplications: 0, interviews: 0 })
  const [recentApplications, setRecentApplications] = useState([])

  const stats = [
    { name: 'Active Jobs', value: String(overview.activeJobs || 0), icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { name: 'Total Applications', value: String(overview.totalApplications || 0), icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
    { name: 'Total Views', value: String(overview.totalViews || 0), icon: TrendingUp, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  ]

  const fetchAnalytics = async () => {
    try {
      const resp = await analyticsApi.getSchoolAnalytics()
      const data = resp.data || resp
      setOverview({
        totalJobs: data?.overview?.totalJobs || 0,
        activeJobs: data?.overview?.activeJobs || 0,
        totalViews: data?.overview?.totalViews || 0,
        totalApplications: data?.overview?.totalApplications || 0,
        interviews: data?.overview?.interviews || 0
      })
      setRecentApplications(data?.recentApplications || [])
    } catch (e) {
      // silently ignore for dashboard
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (!socket || !isConnected) return
    const refresh = () => fetchAnalytics()
    socket.on('new_job_posted', refresh)
    socket.on('job_updated', refresh)
    socket.on('job_deleted', refresh)
    socket.on('application_submitted', refresh)
    socket.on('job_viewed', refresh)
    socket.on('application_updated', refresh)
    return () => {
      socket.off('new_job_posted', refresh)
      socket.off('job_updated', refresh)
      socket.off('job_deleted', refresh)
      socket.off('application_submitted', refresh)
      socket.off('job_viewed', refresh)
      socket.off('application_updated', refresh)
    }
  }, [socket, isConnected])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-gray-600">
          Manage your job postings and review teacher applications.
        </p>
      </div>

      {/* Subscription Status */}

      {/* Stats Grid (live) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-xs text-gray-400">{isConnected ? 'Live' : 'Offline'}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Applications (live) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentApplications.map((application) => (
            <div key={application._id || application.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{application.applicant?.email || application.teacher}</h3>
                  <p className="text-sm text-gray-600">{application.job?.title || application.position}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    application.status === 'submitted' || application.status === 'New' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {application.status}
                  </span>
                  <span className="text-sm text-gray-500">{new Date(application.appliedAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link
            to="/school/applicants"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View all applications →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SchoolDashboard





