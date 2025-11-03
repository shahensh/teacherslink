import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { applicationsApi } from '../../api/applicationsApi'
import { ArrowLeft, Download, Eye, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const ResumeViewer = () => {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resumeUrl, setResumeUrl] = useState(null)
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true)
        
        // Debug authentication
        const token = localStorage.getItem('token')
        console.log('ResumeViewer - Token exists:', !!token)
        console.log('ResumeViewer - Token length:', token ? token.length : 0)
        console.log('ResumeViewer - User data:', localStorage.getItem('user'))
        
        // First get the application details
        const response = await applicationsApi.getApplication(applicationId)
        
        if (response.success && response.data) {
          setApplication(response.data)
          
          // Get the resume URL and create blob for authenticated viewing
          if (response.data.resume?.url) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
            setResumeUrl(`${API_URL}/api/applications/${applicationId}/resume`)
            
            // Create blob URL for iframe viewing
            try {
              const token = localStorage.getItem('token')
              console.log('Fetching PDF from backend proxy:', `${API_URL}/api/applications/${applicationId}/resume`)
              const pdfResponse = await fetch(`${API_URL}/api/applications/${applicationId}/resume`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/pdf, */*'
                }
              })
              
              if (pdfResponse.ok) {
                const contentType = pdfResponse.headers.get('content-type')
                console.log('Response content type:', contentType)
                
                if (contentType && contentType.includes('application/pdf')) {
                  // Successfully got PDF stream
                  console.log('Creating blob from PDF stream')
                  const blob = await pdfResponse.blob()
                  const blobUrl = URL.createObjectURL(blob)
                  setResumeBlobUrl(blobUrl)
                } else if (contentType && contentType.includes('application/json')) {
                  // Backend returned JSON with fallback URL
                  const fallbackData = await pdfResponse.json()
                  console.log('Backend returned fallback data:', fallbackData)
                  if (fallbackData.resumeUrl) {
                    // Try to use the public URL directly in iframe
                    console.log('Using public URL in iframe:', fallbackData.resumeUrl)
                    setResumeBlobUrl(fallbackData.resumeUrl)
                  }
                } else {
                  // Other response type
                  console.log('Unexpected response type:', contentType)
                  setError('Unable to load PDF. Please use the download button.')
                }
              } else {
                console.error('Failed to fetch PDF:', pdfResponse.status)
                setError('Unable to load PDF. Please use the download button.')
              }
            } catch (err) {
              console.error('Error creating blob URL:', err)
              setError('Unable to load PDF. Please use the download button.')
            }
          } else {
            setError('No resume found for this application')
          }
        } else {
          setError(response.message || 'Failed to load application')
        }
      } catch (err) {
        console.error('Error fetching application:', err)
        setError('Failed to load application details')
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplication()
    }
    
    // Cleanup blob URL on unmount
    return () => {
      if (resumeBlobUrl) {
        URL.revokeObjectURL(resumeBlobUrl)
      }
    }
  }, [applicationId])

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication required. Please login again.')
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_URL}/api/applications/${applicationId}/resume`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf, */*'
        }
      })

      if (!response.ok) {
        toast.error('Failed to download resume')
        return
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = application?.resume?.filename || 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed')
    }
  }

  const handleOpenInNewTab = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resume...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Resume Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/school/applicants')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applicants
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/school/applicants')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {application?.applicant?.firstName} {application?.applicant?.lastName}
                </h1>
                <p className="text-sm text-gray-600">
                  {application?.job?.title} • Applied {new Date(application?.appliedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenInNewTab}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Open in New Tab
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Resume: {application?.resume?.filename || 'resume.pdf'}
            </h2>
            <p className="text-sm text-gray-600">
              Uploaded on {new Date(application?.resume?.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="p-6">
            {resumeBlobUrl ? (
              <div className="w-full h-[calc(100vh-300px)] border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={resumeBlobUrl}
                  className="w-full h-full"
                  title="Resume PDF"
                  onError={() => {
                    setError('Failed to load PDF. Please try downloading or opening in a new tab.')
                  }}
                />
              </div>
            ) : resumeUrl ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading resume...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Resume Available</h3>
                <p className="text-gray-600">This application doesn't have a resume attached.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeViewer
