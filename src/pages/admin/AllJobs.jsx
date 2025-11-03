import React, { useState, useEffect, useMemo } from 'react'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye, 
  Users, 
  Mail,
  Building,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react'
import { formatSalaryRange } from '../../utils/currencyHelper'

const AllJobs = () => {
  const { socket, isConnected } = useSocket()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, inactive
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Fetch all jobs
  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter === 'active')
      }

      const response = await api.get(`/api/admin/jobs?${params}`)
      setJobs(response.data.jobs || [])
      setPagination(response.data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(pagination.page)
  }, [statusFilter])

  // Socket.IO real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for new job posted
      socket.on('new_job_posted', (jobData) => {
        console.log('New job posted:', jobData)
        setJobs(prevJobs => [jobData, ...prevJobs])
        toast.success(`New job posted: ${jobData.title}`)
      })

      // Listen for job updates
      socket.on('job_updated', (jobData) => {
        console.log('Job updated:', jobData)
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job._id === jobData._id ? { ...job, ...jobData } : job
          )
        )
      })

      // Listen for job deletions
      socket.on('job_deleted', (jobId) => {
        console.log('Job deleted:', jobId)
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId))
        toast.info('A job was deleted')
      })

      return () => {
        socket.off('new_job_posted')
        socket.off('job_updated')
        socket.off('job_deleted')
      }
    }
  }, [socket, isConnected])

  // Filter jobs based on search term
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return jobs

    const lowerSearch = searchTerm.toLowerCase()
    return jobs.filter(job => {
      const schoolName = job.school?.schoolName?.toLowerCase() || ''
      const schoolEmail = job.school?.contactEmail?.toLowerCase() || ''
      const userEmail = job.postedBy?.email?.toLowerCase() || ''
      const username = job.postedBy?.username?.toLowerCase() || ''
      const title = job.title?.toLowerCase() || ''
      const department = job.department?.toLowerCase() || ''

      return (
        schoolName.includes(lowerSearch) ||
        schoolEmail.includes(lowerSearch) ||
        userEmail.includes(lowerSearch) ||
        username.includes(lowerSearch) ||
        title.includes(lowerSearch) ||
        department.includes(lowerSearch)
      )
    })
  }, [jobs, searchTerm])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: jobs.length,
      active: jobs.filter(j => j.isActive).length,
      inactive: jobs.filter(j => !j.isActive).length,
      urgent: jobs.filter(j => j.urgent).length
    }
  }, [jobs])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchJobs(newPage)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            All Jobs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and monitor all job postings in real-time
          </p>
        </div>
        <button
          onClick={() => fetchJobs(pagination.page)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title, school, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50 transition-colors">
                    {/* Job Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {job.title}
                            </p>
                            {job.urgent && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {job.department}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {job.location?.city || 'N/A'}, {job.location?.state || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            Posted: {formatDate(job.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* School Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {job.school?.schoolName || 'N/A'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{job.school?.contactEmail || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Posted By */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {job.postedBy?.username || 'N/A'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{job.postedBy?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>
                          {job.salary?.min && job.salary?.max
                            ? formatSalaryRange(job.salary.min, job.salary.max, job.salary.currency || 'INR')
                            : 'Not specified'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {job.employmentType || 'N/A'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {job.status || 'draft'}
                      </p>
                    </td>

                    {/* Stats */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Eye className="h-3 w-3" />
                          <span>{job.views || 0} views</span>
                        </div>
                        {job.applications > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Users className="h-3 w-3" />
                            <span>{job.applications} applications</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.pages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllJobs

