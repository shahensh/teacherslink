import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { blogApi } from '../../api/blogApi';
import useUnreadBlogs from '../../hooks/useUnreadBlogs';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Tag,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Megaphone,
  Globe,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const SchoolBlog = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { markAllAsRead } = useUnreadBlogs();
  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    featured: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [loadingBlogDetails, setLoadingBlogDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch published blogs
  const fetchBlogs = useCallback(async (page = 1, reset = false) => {
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

      const response = await blogApi.getPublishedBlogs(params);
      
      if (response.success) {
        if (reset || page === 1) {
          setBlogs(response.blogs);
        } else {
          setBlogs(prev => [...prev, ...response.blogs]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blog posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  // Fetch featured blogs
  const fetchFeaturedBlogs = async () => {
    try {
      const response = await blogApi.getFeaturedBlogs();
      if (response.success) {
        setFeaturedBlogs(response.blogs);
      }
    } catch (error) {
      console.error('Error fetching featured blogs:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBlogs(1, true);
    fetchFeaturedBlogs();
  }, [filters]);

  // Mark all blogs as read when user visits the blog page
  useEffect(() => {
    if (user) {
      console.log('School Blog page: Marking all blogs as read for user:', user.id);
      markAllAsRead();
    }
  }, [user, markAllAsRead]);

  // Socket.IO for real-time updates
  useEffect(() => {
    if (socket) {
      socket.emit('join_blog_room');
      
      socket.on('new_blog_published', (blog) => {
        setBlogs(prev => [blog, ...prev]);
        toast.success('New blog post published!');
      });

      socket.on('blog_updated', (updatedBlog) => {
        setBlogs(prev => prev.map(blog => 
          blog._id === updatedBlog._id ? updatedBlog : blog
        ));
        // Update featured blogs if it's featured
        if (updatedBlog.featured) {
          setFeaturedBlogs(prev => {
            const exists = prev.find(blog => blog._id === updatedBlog._id);
            if (exists) {
              return prev.map(blog => blog._id === updatedBlog._id ? updatedBlog : blog);
            } else {
              return [updatedBlog, ...prev];
            }
          });
        }
      });

      socket.on('blog_deleted', (blogId) => {
        setBlogs(prev => prev.filter(blog => blog._id !== blogId));
        setFeaturedBlogs(prev => prev.filter(blog => blog._id !== blogId));
        toast.info('A blog post was removed');
      });

      return () => {
        socket.emit('leave_blog_room');
        socket.off('new_blog_published');
        socket.off('blog_updated');
        socket.off('blog_deleted');
      };
    }
  }, [socket]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      featured: '',
      search: ''
    });
  };

  // View blog details
  const viewBlogDetails = async (blogId) => {
    try {
      setLoadingBlogDetails(true);
      console.log('Fetching blog details for ID:', blogId);
      const response = await blogApi.getBlogById(blogId);
      console.log('Blog details response:', response);
      
      if (response.success) {
        setSelectedBlog(response.blog);
        setShowBlogModal(true);
        console.log('Blog modal opened successfully');
      } else {
        console.error('API returned error:', response.message);
        toast.error(response.message || 'Failed to load blog post');
      }
    } catch (error) {
      console.error('Error fetching blog details:', error);
      toast.error('Failed to load blog post. Please try again.');
    } finally {
      setLoadingBlogDetails(false);
    }
  };

  // Load more blogs
  const loadMoreBlogs = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchBlogs(pagination.page + 1);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get category icon and color
  const getCategoryInfo = (category) => {
    switch (category) {
      case 'tips':
        return { icon: Lightbulb, color: 'text-blue-600 bg-blue-100', label: 'Tips' };
      case 'interview-prep':
        return { icon: GraduationCap, color: 'text-purple-600 bg-purple-100', label: 'Interview Prep' };
      case 'updates':
        return { icon: Megaphone, color: 'text-green-600 bg-green-100', label: 'Updates' };
      case 'general':
        return { icon: Globe, color: 'text-gray-600 bg-gray-100', label: 'General' };
      default:
        return { icon: FileText, color: 'text-gray-600 bg-gray-100', label: 'General' };
    }
  };

  // Get reading time
  const getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Handle image click
  const handleImageClick = (imageUrl, e) => {
    e.stopPropagation();
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Blog & Forum
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Stay updated with the latest tips, interview prep content, and platform updates.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Real-time updates</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </div>

      {/* Featured Blogs */}
      {featuredBlogs.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-2" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Featured Posts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {featuredBlogs.slice(0, 3).map((blog) => {
              const categoryInfo = getCategoryInfo(blog.category);
              const Icon = categoryInfo.icon;
              return (
                <div
                  key={blog._id}
                  onClick={() => viewBlogDetails(blog._id)}
                  className="bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </div>
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 sm:line-clamp-3">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{formatDate(blog.publishedAt)}</span>
                        <span className="sm:hidden">{new Date(blog.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {getReadingTime(blog.content)}m read
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {blog.views} views
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Filter Posts</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="tips">Tips</option>
                <option value="interview-prep">Interview Prep</option>
                <option value="updates">Updates</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Featured Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Posts</option>
                <option value="true">Featured Only</option>
                <option value="false">Regular Posts</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Actions */}
        {showFilters && (
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Blog Posts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              Latest Posts ({pagination.total})
            </h3>
            <div className="text-xs sm:text-sm text-gray-500">
              Showing {blogs.length} of {pagination.total} posts
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {blogs.map((blog) => {
            const categoryInfo = getCategoryInfo(blog.category);
            const Icon = categoryInfo.icon;
            return (
              <div 
                key={blog._id} 
                onClick={() => !loadingBlogDetails && viewBlogDetails(blog._id)}
                className={`px-4 sm:px-6 py-4 sm:py-6 hover:bg-gray-50 cursor-pointer transition-colors ${loadingBlogDetails ? 'opacity-50' : ''}`}
              >
                 <div className="flex items-start space-x-3 sm:space-x-4">
                   <div className="flex-shrink-0">
                     {blog.media && blog.media.length > 0 ? (
                       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden">
                         <img
                           src={blog.media[0].url}
                           alt={blog.media[0].filename || 'Blog image'}
                           className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                           onClick={(e) => handleImageClick(blog.media[0].url, e)}
                         />
                       </div>
                     ) : (
                       <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                         <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                       </div>
                     )}
                   </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      {blog.featured && (
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2">
                      {blog.title}
                    </h3>
                    
                    {blog.excerpt && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">{formatDate(blog.publishedAt)}</span>
                        <span className="sm:hidden">{new Date(blog.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {getReadingTime(blog.content)}m read
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {blog.views} views
                      </div>
                    </div>
                    </div>

                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {blog.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {blog.tags.length > 3 && (
                            <span className="text-gray-400 text-xs">+{blog.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {pagination.page < pagination.pages && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 text-center">
            {loadingMore ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading more posts...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreBlogs}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
              >
                Load More Posts
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {blogs.length === 0 && !loading && (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts found</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Try adjusting your filters or check back later for new content.
            </p>
          </div>
        )}
      </div>

      {/* Blog Details Modal */}
      {showBlogModal && selectedBlog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-2 sm:top-10 mx-auto p-3 sm:p-5 border w-11/12 sm:w-5/6 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center space-x-2 mb-2">
                  {(() => {
                    const categoryInfo = getCategoryInfo(selectedBlog.category);
                    const Icon = categoryInfo.icon;
                    return (
                      <>
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                        {selectedBlog.featured && (
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                        )}
                      </>
                    );
                  })()}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {selectedBlog.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">{formatDate(selectedBlog.publishedAt)}</span>
                    <span className="sm:hidden">{new Date(selectedBlog.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {getReadingTime(selectedBlog.content)}m read
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {selectedBlog.views} views
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBlogModal(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

             {/* Media Display */}
             {selectedBlog.media && selectedBlog.media.length > 0 && (
               <div className="mb-6">
                 <h4 className="text-sm font-medium text-gray-700 mb-3">Media Attachments</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {selectedBlog.media.map((media, index) => (
                     <div key={index} className="relative group">
                       <img
                         src={media.url}
                         alt={media.filename || `Media ${index + 1}`}
                         className="w-full h-48 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                         onClick={() => window.open(media.url, '_blank')}
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="prose max-w-none mb-6">
               <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm sm:text-base">
                 {selectedBlog.content}
               </div>
             </div>

            {selectedBlog.tags && selectedBlog.tags.length > 0 && (
              <div className="flex items-center space-x-2 mb-6">
                <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {selectedBlog.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs sm:text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
           </div>
         </div>
       )}

       {/* Full-screen Image Modal */}
       {showImageModal && selectedImage && (
         <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
           <div className="relative max-w-4xl max-h-full">
             <img
               src={selectedImage}
               alt="Full size"
               className="max-w-full max-h-full object-contain rounded-lg"
             />
             <button
               onClick={() => setShowImageModal(false)}
               className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
             >
               <X className="h-8 w-8" />
             </button>
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default SchoolBlog;