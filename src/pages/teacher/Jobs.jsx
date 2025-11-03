import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { jobApi } from '../../api/jobApi'
import { applicationsApi } from '../../api/applicationsApi'
import TeacherUpgradePrompt from '../../components/TeacherUpgradePrompt'
import api from '../../api/axios'
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Calendar,
  Star,
  Bookmark,
  Eye,
  Users,
  TrendingUp,
  Bell,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatSalaryRange, getCurrencySymbol } from '../../utils/currencyHelper'

const Jobs = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [salaryFilter, setSalaryFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all')
  const [filteredJobs, setFilteredJobs] = useState([])
  const [sortBy, setSortBy] = useState('newest')
  const [newJobsCount, setNewJobsCount] = useState(0)
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const [planSystemEnabled, setPlanSystemEnabled] = useState(false)
  const [loadingSubscription, setLoadingSubscription] = useState(true)

  useEffect(() => {
    fetchJobs()
    checkSubscriptionStatus()
  }, [])

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true)
      
      console.log('🔍 Checking subscription status for teacher...')
      
      // Check if plan system is enabled
      const systemStatusResponse = await api.get('/api/plans/system-status')
      console.log('📊 Plan system enabled:', systemStatusResponse.data.planSystemEnabled)
      setPlanSystemEnabled(systemStatusResponse.data.planSystemEnabled)
      
      if (systemStatusResponse.data.planSystemEnabled) {
        // Check user's subscription status (use teacher endpoint for teachers)
        const subscriptionResponse = await api.get('/api/teacher-subscription/status')
        console.log('📋 Teacher subscription response:', subscriptionResponse.data)
        console.log('✅ Has active plan:', subscriptionResponse.data.hasActivePlan)
        setHasActivePlan(subscriptionResponse.data.hasActivePlan)
      } else {
        // If plan system is disabled, allow free access
        console.log('🆓 Plan system disabled, allowing free access')
        setHasActivePlan(true)
      }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error)
      console.error('Error details:', error.response?.data || error.message)
      // On error, assume no active plan
      setHasActivePlan(false)
    } finally {
      setLoadingSubscription(false)
      console.log('🏁 Subscription check complete. hasActivePlan:', hasActivePlan)
    }
  }

  useEffect(() => {
    const loadMyApplications = async () => {
      try {
        const resp = await applicationsApi.listMine()
        const data = resp.data || []
        setAppliedJobIds(new Set(data.map(a => a.job?._id).filter(Boolean)))
      } catch (err) {
        // ignore
      }
    }
    loadMyApplications()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, locationFilter, salaryFilter, employmentTypeFilter, sortBy])

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for new job postings
      socket.on('new_job_posted', (jobData) => {
        console.log('New job posted:', jobData)
        setJobs(prevJobs => [jobData, ...prevJobs])
        setNewJobsCount(prev => prev + 1)
        toast.success(`New job posted: ${jobData.title}`, {
          duration: 5000,
          icon: '🎉'
        })
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
      })

      // Listen for applications submitted by current user to mark as applied
      socket.on('application_submitted', (payload) => {
        if (payload?.applicant?._id === user?.id && payload?.job?._id) {
          setAppliedJobIds(prev => new Set(prev).add(payload.job._id))
        }
      })

      return () => {
        socket.off('new_job_posted')
        socket.off('job_updated')
        socket.off('job_deleted')
        socket.off('application_submitted')
      }
    }
  }, [socket, isConnected])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await jobApi.getJobs({ status: 'active' })
      console.log('Jobs fetched:', response.data?.length || 0)
      console.log('First job location:', response.data?.[0]?.location)
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
        job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.school?.schoolName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location?.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        job.location?.state?.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    // Filter by salary
    if (salaryFilter) {
      const [min, max] = salaryFilter.split('-').map(Number)
      filtered = filtered.filter(job => {
        const jobMin = job.salary?.min || 0
        const jobMax = job.salary?.max || 0
        return jobMin >= min && (max ? jobMax <= max : true)
      })
    }

    // Filter by employment type
    if (employmentTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.employmentType === employmentTypeFilter)
    }

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'salary_high':
          return (b.salary?.max || 0) - (a.salary?.max || 0)
        case 'salary_low':
          return (a.salary?.min || 0) - (b.salary?.min || 0)
        case 'title':
          return a.title?.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredJobs(filtered)
  }

  const handleRefresh = () => {
    fetchJobs()
    setNewJobsCount(0)
    toast.success('Jobs refreshed!')
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return 'Salary not specified'
    const currency = salary.currency || 'INR'
    if (salary.min && salary.max) {
      return formatSalaryRange(salary.min, salary.max, currency)
    }
    const symbol = getCurrencySymbol(currency)
    if (salary.min) return `From ${symbol}${salary.min.toLocaleString('en-IN')}`
    if (salary.max) return `Up to ${symbol}${salary.max.toLocaleString('en-IN')}`
    return 'Salary not specified'
  }

  const getEmploymentTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-yellow-100 text-yellow-800',
      'temporary': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading || loadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show upgrade prompt if plan system is enabled and user doesn't have active plan
  if (planSystemEnabled && !hasActivePlan) {
    return <TeacherUpgradePrompt />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Feed</h1>
            <p className="text-blue-100 mt-2">Discover amazing teaching opportunities</p>
            <div className="mt-4 flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                {jobs.length} Available Jobs
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {newJobsCount} New Today
              </div>
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                {isConnected ? 'Live Updates' : 'Offline'}
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs, schools, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Location (city, state)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any Salary</option>
              <option value="30000-50000">$30k - $50k</option>
              <option value="50000-70000">$50k - $70k</option>
              <option value="70000-90000">$70k - $90k</option>
              <option value="90000-120000">$90k+</option>
            </select>
          </div>
          
          <div>
            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="salary_high">Salary: High to Low</option>
              <option value="salary_low">Salary: Low to High</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 
                ? "No jobs are currently available. Check back later!"
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(job.employmentType)}`}>
                      {job.employmentType?.replace('-', ' ').toUpperCase()}
                    </span>
                    {job.urgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        URGENT
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <Building className="w-4 h-4 mr-2" />
                    <span className="font-medium">{job.school?.schoolName || 'School Name'}</span>
                    {(job.location?.city && job.location.city.trim()) && (
                      <>
                        <span className="mx-2">•</span>
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {job.location.city.trim()}
                          {job.location.state && job.location.state.trim() && `, ${job.location.state.trim()}`}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatSalary(job.salary)}
                    </div>
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
                    {job.applicationCount > 0 && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {job.applicationCount} applications
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {planSystemEnabled && !hasActivePlan ? (
                      <>
                        <button
                          onClick={() => toast.error('Premium subscription required to view job details')}
                          className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => toast.error('Premium subscription required to apply for jobs')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/teacher/jobs/${job._id}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                        {appliedJobIds.has(job._id) ? (
                          <button
                            disabled
                            className="inline-flex items-center px-4 py-2 border border-green-300 text-green-700 bg-green-50 rounded-lg cursor-default"
                          >
                            Applied
                          </button>
                        ) : (
                          <Link
                            to={`/teacher/jobs/${job._id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Apply
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Jobs





