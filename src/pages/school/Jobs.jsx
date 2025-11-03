import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { jobApi } from '../../api/jobApi'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

const Jobs = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredJobs, setFilteredJobs] = useState([])

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, statusFilter])

  // Real-time job updates via socket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleJobUpdated = (updatedJob) => {
      console.log('Job updated via socket:', updatedJob)
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === updatedJob._id ? { ...job, ...updatedJob } : job
        )
      )
    }

    const handleJobDeleted = (jobId) => {
      console.log('Job deleted via socket:', jobId)
      setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId))
    }

    const handleApplicationReceived = (data) => {
      console.log('New application received:', data)
      // Update application count for the job
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === data.jobId 
            ? { ...job, applications: (job.applications || 0) + 1 }
            : job
        )
      )
      toast.success(`New application received for ${data.jobTitle}`)
    }

    const handleJobViewed = (data) => {
      console.log('Job viewed:', data)
      // Update view count for the job
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === data.jobId 
            ? { ...job, views: (job.views || 0) + 1 }
            : job
        )
      )
    }

    socket.on('job_updated', handleJobUpdated)
    socket.on('job_deleted', handleJobDeleted)
    socket.on('application_submitted', handleApplicationReceived)
    socket.on('job_viewed', handleJobViewed)

    return () => {
      socket.off('job_updated', handleJobUpdated)
      socket.off('job_deleted', handleJobDeleted)
      socket.off('application_submitted', handleApplicationReceived)
      socket.off('job_viewed', handleJobViewed)
    }
  }, [socket, isConnected])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      console.log('Fetching jobs...')
      const response = await jobApi.getMyJobs()
      console.log('Jobs response:', response)
      setJobs(response.data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await jobApi.updateJobStatus(jobId, newStatus)
      setJobs(jobs.map(job => 
        job._id === jobId ? { ...job, status: newStatus } : job
      ))
      toast.success(`Job ${newStatus === 'active' ? 'published' : 'paused'} successfully`)
    } catch (error) {
      console.error('Error updating job status:', error)
      toast.error('Failed to update job status')
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobApi.deleteJob(jobId)
        setJobs(jobs.filter(job => job._id !== jobId))
        toast.success('Job deleted successfully')
      } catch (error) {
        console.error('Error deleting job:', error)
        toast.error('Failed to delete job')
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      draft: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      closed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Debug log
  console.log('Jobs component rendering:', { jobs, filteredJobs, loading, user })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Posting</h1>
            <p className="text-blue-100 mt-2">Manage your job postings and track applications</p>
            <div className="mt-4 flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {jobs.length} Total Jobs
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                {jobs.filter(job => job.status === 'active').length} Active
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {jobs.reduce((total, job) => total + (job.applicationCount || 0), 0)} Applications
              </div>
            </div>
          </div>
          <Link
            to="/school/post-job"
            className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/school/post-job"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Post New Job</h3>
              <p className="text-sm text-gray-600">Create a new job listing</p>
            </div>
          </div>
        </Link>
        
        <Link
          to="/school/applicants"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">View Applications</h3>
              <p className="text-sm text-gray-600">Review teacher applications</p>
            </div>
          </div>
        </Link>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Job Templates</h3>
              <p className="text-sm text-gray-600">Use pre-made templates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 
                ? "Get started by posting your first job."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {jobs.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/school/post-job"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <div key={job._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {job.location?.city && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location.city}, {job.location.state}
                        </div>
                      )}
                      {job.salary?.min && job.salary?.max && (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ₹{job.salary.min.toLocaleString('en-IN')} - ₹{job.salary.max.toLocaleString('en-IN')}
                        </div>
                      )}
                      {job.schedule?.hours && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.schedule.hours} hours/week
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Posted {formatDate(job.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center mt-4 space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {job.applications || 0} applications
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        {job.views || 0} views
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/school/jobs/${job._id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/school/post-job?edit=${job._id}`}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Edit Job"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {job.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(job._id, 'paused')}
                        className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Pause Job"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : job.status === 'paused' ? (
                      <button
                        onClick={() => handleStatusChange(job._id, 'active')}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Resume Job"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Jobs
