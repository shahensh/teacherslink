import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsApi } from '../../api/applicationsApi'
import { useSocket } from '../../context/SocketContext'
import { MessageCircle, Calendar, MapPin, Building, Clock } from 'lucide-react'

const Applications = () => {
  const [apps, setApps] = useState([])
  const { socket, isConnected } = useSocket()
  const navigate = useNavigate()

  const load = async () => {
    const resp = await applicationsApi.listMine()
    setApps(resp.data || [])
  }

  useEffect(() => {
    load()
  }, [])

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

  const handleMessageClick = (application) => {
    // Navigate to chat page with the specific school
    navigate('/teacher/chat', { 
      state: { 
        applicationId: application._id,
        schoolId: application.school._id,
        schoolName: application.school.schoolName,
        jobTitle: application.job.title
      }
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'interview_scheduled': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>
      {apps.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg">No applications yet</p>
          <p className="text-gray-500 text-sm mt-2">Start applying to jobs to see your applications here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{app.job?.title}</h3>
                      <p className="text-sm text-gray-600">{app.school?.schoolName}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{app.job?.location?.city}, {app.job?.location?.state}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Applied {formatDate(app.appliedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ')}
                    </span>
                    
                    <button
                      onClick={() => handleMessageClick(app)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message School</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Applications







