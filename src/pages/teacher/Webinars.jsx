import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { webinarApi } from '../../api/webinarApi';
import { 
  Video, 
  Play, 
  Calendar, 
  Clock, 
  Users, 
  Eye, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  Download,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherWebinars = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
    sortBy: 'latest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showWebinarModal, setShowWebinarModal] = useState(false);

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

  // Initial load
  useEffect(() => {
    fetchWebinars(1, true);
  }, [filters]);

  // Socket.IO for real-time updates
  useEffect(() => {
    if (socket) {
      socket.emit('join_webinar_room');

      socket.on('webinar_created', (webinar) => {
        toast.success(`New webinar available: ${webinar.title}`);
        setWebinars(prev => [webinar, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      });

      socket.on('webinar_updated', (updatedWebinar) => {
        setWebinars(prev => 
          prev.map(webinar => 
            webinar._id === updatedWebinar._id ? updatedWebinar : webinar
          )
        );
        if (selectedWebinar && selectedWebinar._id === updatedWebinar._id) {
          setSelectedWebinar(updatedWebinar);
        }
      });

      return () => {
        socket.off('webinar_created');
        socket.off('webinar_updated');
      };
    }
  }, [socket, selectedWebinar]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value,
    });
  };

  const loadMoreWebinars = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchWebinars(pagination.page + 1);
    }
  };

  const viewWebinarDetails = (webinar) => {
    setSelectedWebinar(webinar);
    setShowWebinarModal(true);
  };

  const joinWebinar = async (webinarId) => {
    try {
      const response = await webinarApi.joinWebinar(webinarId);
      if (response.success) {
        toast.success('Successfully joined webinar!');
        // Refresh webinars to update attendee count
        fetchWebinars(1, true);
      }
    } catch (error) {
      console.error('Error joining webinar:', error);
      toast.error('Failed to join webinar');
    }
  };

  const getCategoryInfo = (category) => {
    switch (category) {
      case 'teaching':
        return { icon: '📚', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'career':
        return { icon: '💼', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'technology':
        return { icon: '💻', color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'interview-prep':
        return { icon: '🎯', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'general':
      default:
        return { icon: '📖', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes) => {
    // Handle case where duration might be undefined or null
    if (!minutes || isNaN(minutes)) {
      return '0m';
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Webinars & Training
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Access professional development webinars and training sessions.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Live & Recorded Sessions</span>
            <span className="sm:hidden">Live Sessions</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Webinars</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="live">Live Sessions</option>
                <option value="recorded">Recorded Sessions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
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
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search webinars..."
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webinars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))
        ) : webinars.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webinars found</h3>
            <p className="text-gray-600">Check back later for new training sessions.</p>
          </div>
        ) : (
          webinars.map((webinar) => {
            const categoryInfo = getCategoryInfo(webinar.category);
            const isLive = webinar.type === 'live' && webinar.status === 'live';
            const isScheduled = webinar.type === 'live' && webinar.status === 'scheduled';
            const isRecorded = webinar.type === 'recorded';

            return (
              <div key={webinar._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Video Thumbnail */}
                <div className="relative">
                  {webinar.thumbnail ? (
                    <img
                      src={webinar.thumbnail}
                      alt={webinar.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(webinar.status)}`}>
                      {webinar.status}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {webinar.isFeatured && (
                    <div className="absolute top-3 right-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                  )}

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-t-lg">
                    <button
                      onClick={() => viewWebinarDetails(webinar)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all"
                    >
                      <Play className="h-6 w-6 text-gray-800" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{categoryInfo.icon}</span>
                    <span className={`text-xs font-medium ${categoryInfo.color}`}>
                      {webinar.category.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {webinar.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {webinar.description}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(webinar.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{webinar.attendeeCount} joined</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{webinar.views} views</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {isLive && (
                      <button
                        onClick={() => joinWebinar(webinar._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Join Live
                      </button>
                    )}
                    {isScheduled && (
                      <button
                        onClick={() => viewWebinarDetails(webinar)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                    )}
                    {isRecorded && (
                      <button
                        onClick={() => viewWebinarDetails(webinar)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Watch Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {pagination.page < pagination.pages && (
        <div className="text-center">
          <button
            onClick={loadMoreWebinars}
            disabled={loadingMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More Webinars'}
          </button>
        </div>
      )}

      {/* Webinar Details Modal */}
      {showWebinarModal && selectedWebinar && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedWebinar.title}</h3>
              <button
                onClick={() => setShowWebinarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Video Player */}
            {selectedWebinar.type === 'recorded' && selectedWebinar.videoFile && (
              <div className="mb-6">
                <video
                  controls
                  className="w-full h-64 md:h-80 bg-black rounded-lg"
                  poster={selectedWebinar.thumbnail}
                >
                  <source src={selectedWebinar.videoFile.url} type={selectedWebinar.videoFile.format} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Webinar Info */}
            <div className="space-y-4">
              <p className="text-gray-700">{selectedWebinar.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Duration:</span>
                  <p className="text-gray-600">{formatDuration(selectedWebinar.duration)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Type:</span>
                  <p className="text-gray-600 capitalize">{selectedWebinar.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Attendees:</span>
                  <p className="text-gray-600">{selectedWebinar.attendeeCount}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Views:</span>
                  <p className="text-gray-600">{selectedWebinar.views}</p>
                </div>
              </div>

              {selectedWebinar.type === 'live' && selectedWebinar.meetingLink && (
                <div className="mt-4">
                  <a
                    href={selectedWebinar.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Join Meeting</span>
                  </a>
                </div>
              )}

              {selectedWebinar.type === 'recorded' && selectedWebinar.recordingUrl && (
                <div className="mt-4">
                  <a
                    href={selectedWebinar.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWebinars;
