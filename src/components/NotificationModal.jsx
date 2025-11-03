import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, Building, User, Mail, Phone, ExternalLink, Award } from 'lucide-react';

const NotificationModal = ({ notification, isOpen, onClose }) => {
  const navigate = useNavigate();
  
  if (!isOpen || !notification) return null;

  // Debug: Log notification data to see the structure
  console.log('NotificationModal - jobId:', notification.data?.jobId, 'Type:', typeof notification.data?.jobId);
  console.log('NotificationModal - schoolId:', notification.data?.schoolId, 'Type:', typeof notification.data?.schoolId);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'shortlist':
        return '🎉';
      case 'reject':
        return '📄';
      case 'interview':
        return '📅';
      case 'hired':
        return '🎊';
      case 'job_posted':
        return '💼';
      case 'application_received':
        return '📨';
      case 'blog_published':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'shortlist':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'reject':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'interview':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'hired':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'job_posted':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'application_received':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'blog_published':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Helper function to extract ID from various formats
  const extractId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object') {
      return id._id || id.id || id.toString();
    }
    return id.toString();
  };

  // Handle navigation to job details
  const handleViewJobDetails = () => {
    if (notification.data?.jobId) {
      const jobId = extractId(notification.data.jobId);
      console.log('NotificationModal - Navigating to job:', jobId, 'Type:', typeof jobId);
      if (jobId && jobId !== 'undefined' && jobId !== 'null') {
        navigate(`/teacher/jobs/${jobId}`);
        onClose(); // Close modal after navigation
      } else {
        console.error('Invalid jobId:', notification.data.jobId);
      }
    }
  };

  // Handle navigation to school profile
  const handleViewSchoolProfile = () => {
    if (notification.data?.schoolId) {
      const schoolId = extractId(notification.data.schoolId);
      console.log('NotificationModal - Navigating to school:', schoolId, 'Type:', typeof schoolId);
      if (schoolId && schoolId !== 'undefined' && schoolId !== 'null') {
        navigate(`/teacher/school/profile/${schoolId}`);
        onClose(); // Close modal after navigation
      } else {
        console.error('Invalid schoolId:', notification.data.schoolId);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getNotificationIcon(notification.type)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notification Details</h2>
              <p className="text-sm text-gray-500">{formatDate(notification.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notification Type Badge */}
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getNotificationColor(notification.type)}`}>
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </span>
            {!notification.isRead && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                New
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {notification.title}
            </h3>
          </div>

          {/* Message */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Additional Data */}
          {notification.data && (
            <div className="space-y-4">
              {/* School Information */}
              {notification.data.schoolName && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">School Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">School:</span>
                      <span className="text-sm text-gray-900">{notification.data.schoolName}</span>
                    </div>
                    {notification.data.jobTitle && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Position:</span>
                        <span className="text-sm text-gray-900">{notification.data.jobTitle}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Details */}
              {notification.data.applicationId && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Application Details</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Application ID:</span>
                      <span className="text-sm text-gray-900 font-mono">{notification.data.applicationId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {notification.type === 'shortlist' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• The school may contact you directly for further discussions</li>
                    <li>• Keep your profile updated and resume ready</li>
                    <li>• Be prepared for potential interview invitations</li>
                    <li>• Check your email regularly for updates</li>
                  </ul>
                </div>
              )}

              {notification.type === 'reject' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Keep Going!</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Don't be discouraged - this is part of the process</li>
                    <li>• Continue applying to other opportunities</li>
                    <li>• Consider improving your profile and resume</li>
                    <li>• Each application is a learning experience</li>
                  </ul>
                </div>
              )}

              {notification.type === 'interview' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Interview Preparation</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Check your email for interview details and schedule</li>
                    <li>• Prepare your teaching portfolio and examples</li>
                    <li>• Research the school and their teaching philosophy</li>
                    <li>• Prepare thoughtful questions about the role</li>
                  </ul>
                </div>
              )}

              {notification.type === 'hired' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-900 mb-2">Welcome to the Team!</h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• The school will contact you with onboarding details</li>
                    <li>• Prepare your documents for employment verification</li>
                    <li>• Check your email for official offer letter and contract</li>
                    <li>• Contact the school if you have any questions</li>
                    <li>• Get ready to make a positive impact in education!</li>
                  </ul>
                </div>
              )}

              {notification.type === 'blog_published' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">New Blog Post Available</h4>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• Check out the latest tips and insights from our team</li>
                    <li>• Stay updated with interview preparation content</li>
                    <li>• Learn about new platform features and updates</li>
                    <li>• Share your thoughts and engage with the community</li>
                  </ul>
                </div>
              )}

              {/* Interview Details */}
              {notification.data?.interviewDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Interview Details</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-blue-800">Date:</span>
                        <p className="text-sm text-blue-700">{notification.data.interviewDetails.formattedDate || notification.data.interviewDetails.date}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-800">Time:</span>
                        <p className="text-sm text-blue-700">{notification.data.interviewDetails.formattedTime || notification.data.interviewDetails.time}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-800">Type:</span>
                        <p className="text-sm text-blue-700 capitalize">
                          {notification.data.interviewDetails.type === 'video' ? 'Video Call' : 
                           notification.data.interviewDetails.type === 'phone' ? 'Phone Call' : 
                           'In-Person Interview'}
                        </p>
                      </div>
                      {notification.data.interviewDetails.location && (
                        <div>
                          <span className="text-sm font-medium text-blue-800">Location:</span>
                          <p className="text-sm text-blue-700">{notification.data.interviewDetails.location}</p>
                        </div>
                      )}
                    </div>
                    {notification.data.interviewDetails.notes && (
                      <div>
                        <span className="text-sm font-medium text-blue-800">Notes:</span>
                        <p className="text-sm text-blue-700 mt-1">{notification.data.interviewDetails.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hiring Details */}
              {notification.data?.hiringDetails && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-900">Hiring Details</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-emerald-800">Position:</span>
                        <p className="text-sm text-emerald-700">{notification.data.hiringDetails.position}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-emerald-800">School:</span>
                        <p className="text-sm text-emerald-700">{notification.data.hiringDetails.school}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-emerald-800">Hired On:</span>
                        <p className="text-sm text-emerald-700">
                          {new Date(notification.data.hiringDetails.hiredAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {notification.data?.jobId && (
                <button 
                  onClick={handleViewJobDetails}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Job Details</span>
                </button>
              )}
              {notification.data?.schoolId && (
                <button 
                  onClick={handleViewSchoolProfile}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Building className="w-4 h-4" />
                  <span>View School Profile</span>
                </button>
              )}
              {notification.type === 'blog_published' && notification.data?.blogId && (
                <button 
                  onClick={() => {
                    // Navigate to blog page based on user role
                    const userRole = localStorage.getItem('userRole');
                    if (userRole === 'teacher') {
                      navigate('/teacher/blog');
                    } else if (userRole === 'school') {
                      navigate('/school/blog');
                    }
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Blog Post</span>
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Notification ID: {notification._id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
