import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { webinarApi } from '../../api/webinarApi';
import { 
  Video, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  Clock, 
  Play, 
  Upload,
  X,
  Save,
  Filter,
  Search,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminWebinars = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [webinars, setWebinars] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'live',
    scheduledDate: '',
    duration: 60,
    maxParticipants: 100,
    meetingLink: '',
    recordingUrl: '',
    videoFile: null,
    tags: [],
    category: 'teaching',
    presenter: {
      name: '',
      title: '',
      bio: '',
      avatar: ''
    },
    isFeatured: false,
    isPublic: true,
    status: 'scheduled'
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  // Fetch webinars
  const fetchWebinars = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await webinarApi.getAllWebinars(params);
      
      if (response.success) {
        if (reset || page === 1) {
          setWebinars(response.webinars);
        } else {
          setWebinars(prev => [...prev, ...response.webinars]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching webinars:', error);
      toast.error('Failed to fetch webinars');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await webinarApi.getWebinarStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching webinar stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWebinars(1, true);
    fetchStats();
  }, [filters]);

  // Socket.IO for real-time updates
  useEffect(() => {
    if (socket) {
      socket.emit('join_admin_webinar_room');

      socket.on('webinar_created', (webinar) => {
        setWebinars(prev => [webinar, ...prev]);
        fetchStats();
      });

      socket.on('webinar_updated', (updatedWebinar) => {
        setWebinars(prev => 
          prev.map(webinar => 
            webinar._id === updatedWebinar._id ? updatedWebinar : webinar
          )
        );
      });

      socket.on('webinar_deleted', (webinarId) => {
        setWebinars(prev => prev.filter(webinar => webinar._id !== webinarId));
        fetchStats();
      });

      return () => {
        socket.off('webinar_created');
        socket.off('webinar_updated');
        socket.off('webinar_deleted');
      };
    }
  }, [socket]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('presenter.')) {
      const presenterField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        presenter: {
          ...prev.presenter,
          [presenterField]: value
        }
      }));
    } else if (name === 'tags') {
      const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag);
      setFormData(prev => ({
        ...prev,
        [name]: tagsArray
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await webinarApi.uploadThumbnail(file);
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          thumbnail: response.thumbnail
        }));
        toast.success('Thumbnail uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploading(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only MP4, AVI, MOV, WMV, and WebM video files are allowed');
      return;
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('Video file size must be less than 500MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('Preparing...');

    try {
      const response = await webinarApi.uploadVideo(file, (progress, stage) => {
        setUploadProgress(progress);
        setUploadStage(stage === 'uploading' ? 'Uploading...' : 'Compressing...');
      });

      if (response.success) {
        setUploadProgress(100);
        setUploadStage('Complete!');
        
        setFormData(prev => ({
          ...prev,
          videoFile: response.videoFile,
          recordingUrl: '' // Clear recording URL if video file is uploaded
        }));
        toast.success('Video uploaded and compressed successfully');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadStage('');
      }, 1000);
    }
  };

  // Create new webinar
  const handleCreateWebinar = async (e) => {
    e.preventDefault();
    
    try {
      const response = await webinarApi.createWebinar(formData);
      if (response.success) {
        toast.success('Webinar created successfully');
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          type: 'live',
          scheduledDate: '',
          duration: 60,
          maxParticipants: 100,
          meetingLink: '',
          recordingUrl: '',
          videoFile: null,
          tags: [],
          category: 'teaching',
          presenter: {
            name: '',
            title: '',
            bio: '',
            avatar: ''
          },
          isFeatured: false,
          isPublic: true,
          status: 'scheduled'
        });
        fetchWebinars(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating webinar:', error);
      toast.error('Failed to create webinar');
    }
  };

  // Edit webinar
  const handleEditWebinar = (webinar) => {
    setSelectedWebinar(webinar);
    setFormData({
      title: webinar.title,
      description: webinar.description,
      type: webinar.type,
      scheduledDate: webinar.scheduledDate ? new Date(webinar.scheduledDate).toISOString().slice(0, 16) : '',
      duration: webinar.duration,
      maxParticipants: webinar.maxParticipants,
      meetingLink: webinar.meetingLink || '',
      recordingUrl: webinar.recordingUrl || '',
      videoFile: webinar.videoFile || null,
      tags: webinar.tags || [],
      category: webinar.category,
      presenter: webinar.presenter || { name: '', title: '', bio: '', avatar: '' },
      isFeatured: webinar.isFeatured,
      isPublic: webinar.isPublic,
      status: webinar.status,
      thumbnail: webinar.thumbnail || ''
    });
    setShowEditModal(true);
  };

  // Update webinar
  const handleUpdateWebinar = async (e) => {
    e.preventDefault();
    
    try {
      const response = await webinarApi.updateWebinar(selectedWebinar._id, formData);
      if (response.success) {
        toast.success('Webinar updated successfully');
        setShowEditModal(false);
        setSelectedWebinar(null);
        fetchWebinars(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating webinar:', error);
      toast.error('Failed to update webinar');
    }
  };

  // Delete webinar
  const handleDeleteWebinar = async (webinarId) => {
    if (window.confirm('Are you sure you want to delete this webinar?')) {
      try {
        const response = await webinarApi.deleteWebinar(webinarId);
        if (response.success) {
          toast.success('Webinar deleted successfully');
          fetchWebinars(1, true);
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting webinar:', error);
        toast.error('Failed to delete webinar');
      }
    }
  };

  // Load more webinars
  const loadMore = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchWebinars(pagination.page + 1, false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    return type === 'live' ? <Video className="h-4 w-4" /> : <Play className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Webinar Management
            </h1>
            <p className="text-gray-600">
              Create and manage live sessions and recorded webinars.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Webinar</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Webinars</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWebinars}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Webinars</p>
                <p className="text-2xl font-bold text-gray-900">{stats.liveWebinars}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recorded</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recordedWebinars}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="live">Live</option>
              <option value="recorded">Recorded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="teaching">Teaching</option>
              <option value="career">Career</option>
              <option value="technology">Technology</option>
              <option value="interview-prep">Interview Prep</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search webinars..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Webinars List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Webinars ({pagination.total})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading webinars...</p>
            </div>
          ) : webinars.length === 0 ? (
            <div className="p-6 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No webinars found</p>
            </div>
          ) : (
            webinars.map((webinar) => (
              <div key={webinar._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(webinar.type)}
                      <h4 className="text-lg font-medium text-gray-900">{webinar.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(webinar.status)}`}>
                        {webinar.status}
                      </span>
                      {webinar.isFeatured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{webinar.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {webinar.type === 'live' && webinar.scheduledDate
                            ? new Date(webinar.scheduledDate).toLocaleDateString()
                            : 'Recorded'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{webinar.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{webinar.attendeeCount} attendees</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{webinar.views} views</span>
                      </div>
                    </div>
                    
                    {/* Video Preview for Recorded Webinars */}
                    {webinar.type === 'recorded' && (webinar.videoFile || webinar.recordingUrl) && (
                      <div className="mt-3">
                        {webinar.videoFile ? (
                          <div className="relative">
                            <video
                              controls
                              className="w-full max-w-md h-48 object-cover rounded-lg"
                              poster={webinar.thumbnail}
                            >
                              <source src={webinar.videoFile.url} type={webinar.videoFile.format} />
                              Your browser does not support the video tag.
                            </video>
                            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {webinar.videoFile.filename}
                            </div>
                            {webinar.videoFile.compressionInfo && (
                              <div className="absolute bottom-2 left-2 bg-blue-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                📦 {webinar.videoFile.compressionInfo.compressionRatio}% smaller
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <Play className="h-4 w-4" />
                            <a
                              href={webinar.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Watch Recording
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditWebinar(webinar)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWebinar(webinar._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {pagination.page < pagination.pages && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Create Webinar Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Webinar</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateWebinar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter webinar title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter webinar description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="live">Live Session</option>
                    <option value="recorded">Recorded Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="teaching">Teaching</option>
                    <option value="career">Career</option>
                    <option value="technology">Technology</option>
                    <option value="interview-prep">Interview Prep</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              {formData.type === 'live' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    required={formData.type === 'live'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.type === 'live' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link *</label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    required={formData.type === 'live'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              {formData.type === 'recorded' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Video File</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="video/mp4,video/avi,video/mov,video/wmv,video/webm"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="video-upload"
                        className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 mb-2">
                          {uploading ? `${uploadStage} ${uploadProgress}%` : 'Click to upload video file or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">
                          MP4, AVI, MOV, WMV, WebM up to 500MB
                        </p>
                        {uploading && (
                          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </label>
                    </div>
                    {formData.videoFile && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md relative">
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              videoFile: null
                            }));
                            // Reset file input
                            const fileInput = document.getElementById('video-upload');
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-sm text-green-800 pr-6">
                          ✓ Video uploaded: {formData.videoFile.filename}
                        </p>
                        <p className="text-xs text-green-600">
                          Size: {(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {formData.videoFile.compressionInfo && (
                          <div className="mt-2 text-xs text-blue-600">
                            <p>📦 Compressed: {formData.videoFile.compressionInfo.compressionRatio}% size reduction</p>
                            <p>Original: {(formData.videoFile.compressionInfo.originalSize / (1024 * 1024)).toFixed(2)} MB → 
                               Compressed: {(formData.videoFile.compressionInfo.compressedSize / (1024 * 1024)).toFixed(2)} MB</p>
                            <p>Compression time: {formData.videoFile.compressionInfo.compressionTime.toFixed(1)}s</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center text-gray-500">OR</div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recording URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        name="recordingUrl"
                        value={formData.recordingUrl}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      {formData.recordingUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              recordingUrl: ''
                            }));
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this if you have a video hosted elsewhere (YouTube, Vimeo, etc.)
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presenter Name *</label>
                <input
                  type="text"
                  name="presenter.name"
                  value={formData.presenter.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter presenter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presenter Title</label>
                <input
                  type="text"
                  name="presenter.title"
                  value={formData.presenter.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter presenter title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="teaching, technology, career"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Public</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Create Webinar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Webinar Modal */}
      {showEditModal && selectedWebinar && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Webinar</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateWebinar} className="space-y-4">
              {/* Same form fields as create modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="live">Live Session</option>
                    <option value="recorded">Recorded Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Rest of the form fields similar to create modal */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Webinar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWebinars;
