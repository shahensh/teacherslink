import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { blogApi } from '../../api/blogApi';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Search,
  Filter,
  Calendar,
  User,
  MessageCircle,
  Heart,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  AlertCircle,
  Image,
  Type,
  Upload,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBlog = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [postingType, setPostingType] = useState('text'); // 'text' or 'image'
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
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

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    tags: [],
    status: 'draft',
    featured: false,
    media: []
  });

  // Fetch blogs with current filters and pagination
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

      const response = await blogApi.getAllBlogs(params);
      
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
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  // Fetch blog statistics
  const fetchStats = async () => {
    try {
      const response = await blogApi.getBlogStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching blog stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBlogs(1, true);
    fetchStats();
  }, [filters]);


  // Socket.IO for real-time updates
  useEffect(() => {
    if (socket) {
      socket.emit('join_admin_blog_room');
      
      socket.on('blog_created', (blog) => {
        setBlogs(prev => [blog, ...prev]);
        toast.success('New blog post created');
      });

      socket.on('blog_updated', (updatedBlog) => {
        setBlogs(prev => prev.map(blog => 
          blog._id === updatedBlog._id ? updatedBlog : blog
        ));
        toast.success('Blog post updated');
      });

      socket.on('blog_deleted', (blogId) => {
        setBlogs(prev => prev.filter(blog => blog._id !== blogId));
        toast.success('Blog post deleted');
      });

      return () => {
        socket.emit('leave_admin_blog_room');
        socket.off('blog_created');
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
      status: '',
      category: '',
      featured: '',
      search: ''
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle tags input
  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/blogs/admin/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setUploadedImages(prev => [...prev, ...data.images]);
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, ...data.images]
        }));
        
        toast.success(data.message);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded image
  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  // Create new blog post
  const handleCreateBlog = async (e) => {
    e.preventDefault();
    
    // Validate image posts
    if (postingType === 'image' && uploadedImages.length === 0) {
      toast.error('Please upload at least one image for image posts');
      return;
    }
    
    try {
      const response = await blogApi.createBlog(formData);
      if (response.success) {
        toast.success('Blog post created successfully');
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          category: 'general',
          tags: [],
          status: 'draft',
          featured: false,
          media: []
        });
        setUploadedImages([]);
        setPostingType('text');
        fetchBlogs(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create blog post');
    }
  };

  // Edit blog post
  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      category: blog.category,
      tags: blog.tags || [],
      status: blog.status,
      featured: blog.featured,
      media: blog.media || []
    });
    setUploadedImages(blog.media || []);
    setPostingType(blog.media && blog.media.length > 0 ? 'image' : 'text');
    setShowEditModal(true);
  };

  // Update blog post
  const handleUpdateBlog = async (e) => {
    e.preventDefault();
    
    // Validate image posts
    if (postingType === 'image' && uploadedImages.length === 0) {
      toast.error('Please upload at least one image for image posts');
      return;
    }
    
    try {
      const response = await blogApi.updateBlog(selectedBlog._id, formData);
      if (response.success) {
        toast.success('Blog post updated successfully');
        setShowEditModal(false);
        setSelectedBlog(null);
        setUploadedImages([]);
        setPostingType('text');
        fetchBlogs(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error('Failed to update blog post');
    }
  };

  // Delete blog post
  const handleDeleteBlog = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        const response = await blogApi.deleteBlog(blogId);
        if (response.success) {
          toast.success('Blog post deleted successfully');
          fetchBlogs(1, true);
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting blog:', error);
        toast.error('Failed to delete blog post');
      }
    }
  };

  // Toggle blog status
  const toggleBlogStatus = async (blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      const response = await blogApi.updateBlog(blog._id, { status: newStatus });
      if (response.success) {
        toast.success(`Blog post ${newStatus === 'published' ? 'published' : 'unpublished'}`);
        fetchBlogs(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating blog status:', error);
      toast.error('Failed to update blog status');
    }
  };

  // Toggle featured status
  const toggleFeatured = async (blog) => {
    try {
      const response = await blogApi.updateBlog(blog._id, { featured: !blog.featured });
      if (response.success) {
        toast.success(`Blog post ${!blog.featured ? 'featured' : 'unfeatured'}`);
        fetchBlogs(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'tips': return 'text-blue-600 bg-blue-100';
      case 'interview-prep': return 'text-purple-600 bg-purple-100';
      case 'updates': return 'text-green-600 bg-green-100';
      case 'general': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Blog & Forum Management
            </h1>
            <p className="text-gray-600">
              Create and manage blog posts, tips, interview prep content, and updates.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Posting Type Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setPostingType('text');
                  setShowCreateModal(true);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  postingType === 'text' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Type className="h-4 w-4" />
                <span>Text</span>
              </button>
              <button
                onClick={() => {
                  setPostingType('image');
                  setShowCreateModal(true);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  postingType === 'image' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Image className="h-4 w-4" />
                <span>Image</span>
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBlogs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedBlogs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draftBlogs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{stats.featuredBlogs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
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
                Featured
              </label>
              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Posts</option>
                <option value="true">Featured Only</option>
                <option value="false">Not Featured</option>
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
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Blog Posts ({pagination.total})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {blogs.length} of {pagination.total} posts
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {blogs.map((blog) => (
            <div key={blog._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {blog.title}
                    </h4>
                    {blog.featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                      {blog.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(blog.category)}`}>
                      {blog.category}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(blog.createdAt)}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      {blog.author?.email}
                    </div>
                  </div>

                  {blog.excerpt && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {blog.excerpt}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {blog.views} views
                    </div>
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {blog.likeCount || 0} likes
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {blog.commentCount || 0} comments
                    </div>
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>Tags:</span>
                        {blog.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-gray-100 px-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {blog.tags.length > 3 && (
                          <span className="text-gray-400">+{blog.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditBlog(blog)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Edit Post"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleBlogStatus(blog)}
                    className="p-2 text-gray-400 hover:text-green-600"
                    title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {blog.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => toggleFeatured(blog)}
                    className="p-2 text-gray-400 hover:text-yellow-600"
                    title={blog.featured ? 'Remove from Featured' : 'Add to Featured'}
                  >
                    {blog.featured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteBlog(blog._id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete Post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {pagination.page < pagination.pages && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            {loadingMore ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading more posts...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreBlogs}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Load More Posts
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {blogs.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or create a new post.
            </p>
          </div>
        )}
      </div>

      {/* Create Blog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Create New {postingType === 'text' ? 'Text' : 'Image'} Post
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPostingType('text')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                      postingType === 'text' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Type className="h-3 w-3" />
                    <span>Text</span>
                  </button>
                  <button
                    onClick={() => setPostingType('image')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                      postingType === 'image' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Image className="h-3 w-3" />
                    <span>Image</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setUploadedImages([]);
                  setPostingType('text');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateBlog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog post title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="tips">Tips</option>
                  <option value="interview-prep">Interview Prep</option>
                  <option value="updates">Updates</option>
                </select>
              </div>

              {/* Image Upload Section */}
              {postingType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        {uploading ? 'Uploading...' : 'Click to upload images or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                    </label>
                  </div>
                  
                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Uploaded Images ({uploadedImages.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.url}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content {postingType === 'text' ? '*' : ''}
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required={postingType === 'text'}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={postingType === 'text' 
                    ? "Write your blog post content here..." 
                    : "Add a description for your images (optional)..."}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the post (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., teaching, education, career"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Featured Post
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
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
                  <span>Create Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Blog Modal */}
      {showEditModal && selectedBlog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit {postingType === 'text' ? 'Text' : 'Image'} Post
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPostingType('text')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                      postingType === 'text' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Type className="h-3 w-3" />
                    <span>Text</span>
                  </button>
                  <button
                    onClick={() => setPostingType('image')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                      postingType === 'image' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Image className="h-3 w-3" />
                    <span>Image</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setUploadedImages([]);
                  setPostingType('text');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateBlog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="tips">Tips</option>
                  <option value="interview-prep">Interview Prep</option>
                  <option value="updates">Updates</option>
                </select>
              </div>

              {/* Image Upload Section */}
              {postingType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-edit"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload-edit"
                      className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        {uploading ? 'Uploading...' : 'Click to upload images or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                    </label>
                  </div>
                  
                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Uploaded Images ({uploadedImages.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.url}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content {postingType === 'text' ? '*' : ''}
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required={postingType === 'text'}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={postingType === 'text' 
                    ? "Write your blog post content here..." 
                    : "Add a description for your images (optional)..."}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Featured Post
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

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
                  <span>Update Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
