import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jobApi } from '../../api/jobApi'
import { applicationsApi } from '../../api/applicationsApi'
import { useSocket } from '../../context/SocketContext'
import TeacherUpgradePrompt from '../../components/TeacherUpgradePrompt'
import api from '../../api/axios'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Award, 
  CheckCircle, 
  Star,
  Building,
  Globe,
  FileText,
  Send,
  ArrowLeft,
  Heart,
  Share2,
  Eye,
  User,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

const JobDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coverLetter, setCoverLetter] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [realTimeViews, setRealTimeViews] = useState(0)
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const [planSystemEnabled, setPlanSystemEnabled] = useState(false)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)
  const [subscriptionResult, setSubscriptionResult] = useState(null)

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      console.log('🔍 Starting subscription check...')
      setLoadingSubscription(true)
      
      // Check if plan system is enabled
      console.log('🔍 Checking plan system status...')
      const systemStatusResponse = await api.get('/api/plans/system-status')
      const planSystemEnabled = systemStatusResponse.data.planSystemEnabled
      console.log('🔍 Plan system enabled:', planSystemEnabled)
      setPlanSystemEnabled(planSystemEnabled)
      
      let hasActivePlan = false
      if (planSystemEnabled) {
        console.log('🔍 Plan system is enabled - checking teacher subscription...')
        try {
          // Check user's subscription status (use teacher endpoint for teachers)
          const subscriptionResponse = await api.get('/api/teacher-subscription/status')
          hasActivePlan = subscriptionResponse.data.hasActivePlan
          console.log('🔍 Teacher subscription response:', subscriptionResponse.data)
          console.log('🔍 User has active plan:', hasActivePlan)
          setHasActivePlan(hasActivePlan)
        } catch (subError) {
          console.error('❌ Error checking teacher subscription:', subError)
          console.error('❌ Subscription error details:', subError.response?.data || subError.message)
          // If subscription check fails, block access
          hasActivePlan = false
          console.log('❌ BLOCKING ACCESS - SUBSCRIPTION CHECK FAILED')
          setHasActivePlan(false)
        }
      } else {
        // If plan system is disabled, allow free access
        hasActivePlan = true
        console.log('🔍 Plan system disabled - allowing free access')
        setHasActivePlan(true)
      }
      
      const result = { planSystemEnabled, hasActivePlan }
      console.log('🔍 Final subscription check result:', result)
      setSubscriptionResult(result)
      setSubscriptionChecked(true)
      return result
    } catch (error) {
      console.error('❌ Error checking subscription status:', error)
      console.error('❌ Error details:', error.response?.data || error.message)
      // CRITICAL: On error, assume no active plan and block access
      console.log('❌ BLOCKING ACCESS DUE TO SUBSCRIPTION CHECK ERROR')
      const result = { planSystemEnabled: true, hasActivePlan: false }
      setHasActivePlan(false)
      setSubscriptionResult(result)
      setSubscriptionChecked(true)
      return result
    } finally {
      setLoadingSubscription(false)
    }
  }

  // Immediate subscription check on component mount
  React.useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  useEffect(() => {
    const load = async () => {
      console.log('JobDetails useEffect - subscriptionChecked:', subscriptionChecked, 'subscriptionResult:', subscriptionResult)
      
      // Wait for subscription check to complete
      if (!subscriptionChecked || !subscriptionResult) {
        console.log('Subscription check not complete yet, waiting...')
        return
      }
      
      try {
        console.log('Subscription check complete - planSystemEnabled:', subscriptionResult.planSystemEnabled, 'hasActivePlan:', subscriptionResult.hasActivePlan)
        
        // CRITICAL: Only load job details if user has active plan OR plan system is disabled
        if (subscriptionResult.planSystemEnabled && !subscriptionResult.hasActivePlan) {
          console.log('🚫 SUBSCRIPTION REQUIRED - NOT LOADING JOB DETAILS')
          console.log('🚫 Plan system enabled:', subscriptionResult.planSystemEnabled)
          console.log('🚫 User has active plan:', subscriptionResult.hasActivePlan)
          console.log('🚫 BLOCKING ALL JOB ACCESS')
          return
        }
        
        // ADDITIONAL SAFETY CHECK: If subscription result is invalid, block access
        if (!subscriptionResult || typeof subscriptionResult.hasActivePlan === 'undefined') {
          console.log('🚫 INVALID SUBSCRIPTION RESULT - BLOCKING ACCESS')
          return
        }
        
        console.log('✅ Loading job details - user has access')
        // Load job details
        const jobResp = await jobApi.getJob(id)
        const jobData = jobResp.data || jobResp
        setJob(jobData)
        setRealTimeViews(jobData.views || 0)
        
        console.log('Job details loaded:', jobData)
        console.log('Location data:', jobData.location)
        
        // Try to check application status, but don't fail if it errors
        try {
          const applicationResp = await applicationsApi.checkApplicationStatus(id)
          if (applicationResp && applicationResp.data) {
            setHasApplied(applicationResp.data.hasApplied)
            setApplicationStatus(applicationResp.data.application)
            console.log('Application status:', applicationResp.data)
          } else {
            console.warn('Invalid application status response:', applicationResp)
            setHasApplied(false)
            setApplicationStatus(null)
          }
        } catch (appError) {
          console.warn('Could not check application status:', appError)
          // Set default values if application status check fails
          setHasApplied(false)
          setApplicationStatus(null)
          // Don't show error toast for this, as it's not critical
        }
      } catch (e) {
        console.error('Error loading job:', e)
        toast.error('Job not found')
        navigate('/teacher/jobs', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, subscriptionChecked, subscriptionResult])

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket && job) {
      // Listen for job view updates
      const handleJobViewUpdate = (data) => {
        if (data.jobId === id) {
          setRealTimeViews(prev => prev + 1)
        }
      }

      // Listen for application status updates
      const handleApplicationStatusUpdate = (data) => {
        if (data.applicationId && applicationStatus && data.applicationId === applicationStatus._id) {
          setApplicationStatus(prev => ({ ...prev, status: data.status }))
        }
      }

      socket.on('job_viewed', handleJobViewUpdate)
      socket.on('application_status_updated', handleApplicationStatusUpdate)

      return () => {
        socket.off('job_viewed', handleJobViewUpdate)
        socket.off('application_status_updated', handleApplicationStatusUpdate)
      }
    }
  }, [socket, job, applicationStatus])

  const handleApply = async () => {
    try {
      setIsApplying(true)
      console.log('JobDetails - Applying to job:', id)
      
      if (!id) {
        toast.error('Invalid job ID')
        return
      }

      // Check subscription status before allowing application
      if (planSystemEnabled && !hasActivePlan) {
        toast.error('Premium subscription required to apply for jobs')
        return
      }
      
      const applicationData = {
        jobId: id,
        coverLetter: coverLetter || ''
      }
      
      const response = await applicationsApi.submit(applicationData)
      setHasApplied(true)
      setApplicationStatus(response.data)
      toast.success('Application submitted successfully!')
    } catch (e) {
      console.error('JobDetails - Application error:', e)
      const msg = e.response?.data?.message || e.message || 'Failed to submit application'
      toast.error(msg)
    } finally {
      setIsApplying(false)
    }
  }

  const handleSaveJob = () => {
    setIsSaved(!isSaved)
    toast.success(isSaved ? 'Job removed from saved' : 'Job saved successfully!')
  }

  const handleShareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity: ${job.title}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Job link copied to clipboard!')
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Not specified'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified'
    const { min, max, currency, negotiable } = salary
    let salaryText = ''
    
    if (min && max) {
      salaryText = `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    } else if (min) {
      salaryText = `${currency} ${min.toLocaleString()}+`
    } else if (max) {
      salaryText = `Up to ${currency} ${max.toLocaleString()}`
    } else {
      salaryText = 'Salary not specified'
    }
    
    if (negotiable) {
      salaryText += ' (Negotiable)'
    }
    
    return salaryText
  }

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading || loadingSubscription || !subscriptionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    )
  }

  // CRITICAL: Show upgrade prompt if plan system is enabled and user doesn't have active plan
  if (planSystemEnabled && !hasActivePlan) {
    console.log('🚫 RENDERING UPGRADE PROMPT - NO SUBSCRIPTION')
    return <TeacherUpgradePrompt />
  }
  
  // ADDITIONAL SAFETY: If subscription result is invalid, show upgrade prompt
  if (!subscriptionResult || typeof subscriptionResult.hasActivePlan === 'undefined') {
    console.log('🚫 INVALID SUBSCRIPTION RESULT - SHOWING UPGRADE PROMPT')
    return <TeacherUpgradePrompt />
  }

  if (!job) return null

  const daysUntilDeadline = getDaysUntilDeadline(job.applicationDeadline)
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/jobs')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
          <div>
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{job.school?.schoolName || 'School Name'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location?.city}, {job.location?.state}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{job.employmentType}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveJob}
                className={`p-2 rounded-full transition-colors ${
                  isSaved 
                    ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShareJob}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Overview</h2>
                  {isUrgent && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-4">
                      <Clock className="w-4 h-4 mr-1" />
                      Urgent - {daysUntilDeadline} days left
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>{realTimeViews} views</span>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">{job.description}</p>
              </div>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Key Responsibilities
                </h3>
                <ul className="space-y-3">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                Requirements & Qualifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                  <p className="text-gray-700">{job.requirements?.education || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                  <p className="text-gray-700">{job.requirements?.experience || 'Not specified'}</p>
                </div>
              </div>
              
              {job.requirements?.certifications && job.requirements.certifications.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.certifications.map((cert, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Award className="w-4 h-4 mr-1" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {job.requirements?.skills && job.requirements.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Compensation & Benefits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Compensation & Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Salary</h4>
                  <p className="text-2xl font-bold text-green-600">{formatSalary(job.salary)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Employment Type</h4>
                  <p className="text-gray-700 capitalize">{job.employmentType}</p>
                </div>
              </div>
              
              {job.benefits && job.benefits.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {job.perks && job.perks.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Perks</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.perks.map((perk, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <Star className="w-4 h-4 mr-1" />
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location & Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Location & Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                  <div className="space-y-1">
                    {job.location?.address && job.location.address.trim() && (
                      <p className="text-gray-700">{job.location.address}</p>
                    )}
                    {((job.location?.city && job.location.city.trim()) || (job.location?.state && job.location.state.trim())) && (
                      <p className="text-gray-700">
                        {job.location?.city && job.location.city.trim()}{job.location?.city && job.location.city.trim() && job.location?.state && job.location.state.trim() ? ', ' : ''}{job.location?.state && job.location.state.trim()} {job.location?.zipCode && job.location.zipCode.trim() || ''}
                      </p>
                    )}
                    {job.location?.country && job.location.country.trim() && (
                      <p className="text-gray-700">{job.location.country}</p>
                    )}
                    {(!job.location?.city || !job.location.city.trim()) && (!job.location?.state || !job.location.state.trim()) && (!job.location?.address || !job.location.address.trim()) && (
                      <p className="text-gray-500 italic">Location not specified</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      {job.location?.remote && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Globe className="w-3 h-3 mr-1" />
                          Remote
                        </span>
                      )}
                      {job.location?.hybrid && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Globe className="w-3 h-3 mr-1" />
                          In School
                        </span>
                      )}
                    </div>
                  </div>
          </div>
          <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
                  <div className="space-y-1">
                    {job.schedule?.hours && <p className="text-gray-700">Hours: {job.schedule.hours}</p>}
                    {job.schedule?.days && job.schedule.days.length > 0 && (
                      <p className="text-gray-700">Days: {job.schedule.days.join(', ')}</p>
                    )}
                    {job.schedule?.flexibility && (
                      <p className="text-gray-700">Flexibility: {job.schedule.flexibility}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Process */}
            {job.applicationProcess && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Application Process
                </h3>
                {job.applicationProcess.steps && job.applicationProcess.steps.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Process Steps</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      {job.applicationProcess.steps.map((step, index) => (
                        <li key={index} className="text-gray-700">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {job.applicationProcess.documents && job.applicationProcess.documents.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Required Documents</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {job.applicationProcess.documents.map((doc, index) => (
                        <li key={index} className="text-gray-700">{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {job.applicationProcess.interviewProcess && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Interview Process</h4>
                    <p className="text-gray-700">{job.applicationProcess.interviewProcess}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card or Applied Status */}
            {hasApplied ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted</h3>
                  <p className="text-gray-600 mb-4">You have successfully applied for this position.</p>
                  
                  {applicationStatus && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          applicationStatus.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          applicationStatus.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                          applicationStatus.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          applicationStatus.status === 'interview_scheduled' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {applicationStatus.status.charAt(0).toUpperCase() + applicationStatus.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Applied on:</span>
                        <span className="text-sm text-gray-900">
                          {applicationStatus.appliedAt ? new Date(applicationStatus.appliedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => navigate('/teacher/applications')}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View My Applications
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for this position</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter (optional)</label>
                    <textarea 
                      value={coverLetter} 
                      onChange={(e) => setCoverLetter(e.target.value)} 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                      rows={4} 
                      placeholder="Write a brief cover letter explaining why you're interested in this position..."
                    />
                  </div>
                  
                  <button 
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isApplying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Job Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Department</span>
                  <span className="font-medium text-gray-900">{job.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-medium text-gray-900">{formatDate(job.startDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Application Deadline</span>
                  <span className={`font-medium ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(job.applicationDeadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-medium text-gray-900">{formatDate(job.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-medium text-gray-900">{realTimeViews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-medium text-gray-900">{job.applications || 0}</span>
                </div>
        </div>
      </div>

            {/* School Info Card */}
            {job.school && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About the School</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
                      <h4 className="font-medium text-gray-900">{job.school.schoolName}</h4>
                      <p className="text-sm text-gray-600">{job.location?.city}, {job.location?.state}</p>
                    </div>
          </div>
                  <button
                    onClick={() => navigate(`/teacher/school/profile/${job.school._id}`)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View School Profile
            </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobDetails