import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { applicationsApi } from '../../api/applicationsApi'
import { useSocket } from '../../context/SocketContext'
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Users,
  Building
} from 'lucide-react'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { socket, isConnected } = useSocket()
  const [statsValues, setStatsValues] = useState({ sent: 0, interviews: 0, offers: 0, views: 0 })
  const [recentJobs, setRecentJobs] = useState([])

  const stats = [
    {
      name: t('applicationsSent'),
      value: String(statsValues.sent),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: t('interviewsScheduled'),
      value: String(statsValues.interviews),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: t('offersReceived'),
      value: String(statsValues.offers),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: t('profileViews'),
      value: String(statsValues.views),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  const load = async () => {
    const resp = await applicationsApi.listMine()
    const data = resp.data || []
    setRecentJobs(data.slice(0, 5).map(a => ({
      id: a._id,
      title: a.job?.title,
      school: a.school?.schoolName,
      location: `${a.job?.location?.city || ''}${a.job?.location?.state ? ', ' + a.job.location.state : ''}`,
      salary: a.job?.salary?.min ? `₹${a.job.salary.min.toLocaleString('en-IN')}${a.job?.salary?.max ? ' - ₹' + a.job.salary.max.toLocaleString('en-IN') : ''}` : '',
      posted: new Date(a.appliedAt).toLocaleDateString(),
      status: a.status
    })))
    setStatsValues({
      sent: data.length,
      interviews: data.filter(a => a.status === 'interview-scheduled').length,
      offers: data.filter(a => a.status === 'accepted').length,
      views: statsValues.views
    })
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!socket || !isConnected) return
    const refresh = () => load()
    socket.on('application_submitted', refresh)
    socket.on('application_updated', refresh)
    return () => {
      socket.off('application_submitted', refresh)
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
          Here's what's happening with your job applications and profile.
        </p>
      </div>

      {/* Subscription Status */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('recentApplications')}</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentJobs.map((job) => (
            <div key={job.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-1" />
                    {job.school} • {job.location}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{job.salary}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'Applied' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-sm text-gray-500">{job.posted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link
            to="/teacher/applications"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('viewAllApplications')} →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard





