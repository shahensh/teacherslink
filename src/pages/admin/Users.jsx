import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/adminApi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building, 
  Filter, 
  Search, 
  RefreshCw, 
  Eye, 
  UserCheck, 
  UserX,
  Calendar,
  Mail,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    isVerified: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userIdToLoad, setUserIdToLoad] = useState(null);

  // Fetch users with current filters and pagination
  const fetchUsers = useCallback(async (page = 1, reset = false) => {
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

      const response = await adminApi.getAllUsers(params);
      
      if (response.success) {
        if (reset || page === 1) {
          setUsers(response.users);
        } else {
          setUsers(prev => [...prev, ...response.users]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  // Load more users (infinite scroll)
  const loadMoreUsers = useCallback(() => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchUsers(pagination.page + 1);
    }
  }, [pagination.page, pagination.pages, loadingMore, fetchUsers]);

  // Get userId from query params on mount
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setUserIdToLoad(userId);
      // Clear the query parameter immediately to avoid re-triggering
      const newParams = new URLSearchParams();
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Initial load
  useEffect(() => {
    fetchUsers(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle userId loading after initial data fetch is complete
  useEffect(() => {
    if (userIdToLoad && !loading) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        if (userIdToLoad) {
          viewUserDetails(userIdToLoad).catch((error) => {
            console.error('Error opening user details:', error);
            toast.error('Failed to load user details');
          }).finally(() => {
            setUserIdToLoad(null);
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdToLoad, loading]);

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
      role: '',
      isVerified: '',
      isActive: '',
      search: ''
    });
  };

  // View user details
  const viewUserDetails = useCallback(async (userId) => {
    try {
      const response = await adminApi.getUserById(userId);
      if (response.success) {
        setSelectedUser(response);
        setShowUserModal(true);
      } else {
        toast.error('Failed to fetch user details');
      }
      return response;
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details');
      throw error;
    }
  }, []);

  // Update user status
  const updateUserStatus = async (userId, statusData) => {
    try {
      const response = await adminApi.updateUserStatus(userId, statusData);
      if (response.success) {
        toast.success('User status updated successfully');
        // Refresh the user in the list
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, ...statusData } : user
        ));
        // Close modal if open
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
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

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'teacher': return 'text-blue-600 bg-blue-100';
      case 'school': return 'text-green-600 bg-green-100';
      case 'admin': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (isActive, isVerified) => {
    if (isActive && isVerified) return 'text-green-600 bg-green-100';
    if (isActive && !isVerified) return 'text-yellow-600 bg-yellow-100';
    if (!isActive) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Scroll event handler for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreUsers();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreUsers]);

  if (loading && users.length === 0) {
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
              User Management
            </h1>
            <p className="text-gray-600">
              Manage all registered users, teachers, and schools.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fetchUsers(1, true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

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
                  placeholder="Search by email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type
              </label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                <option value="teacher">Teachers</option>
                <option value="school">Schools</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Status
              </label>
              <select
                value={filters.isVerified}
                onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({pagination.total})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {users.length} of {pagination.total} users
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div key={user._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.role === 'teacher' ? (
                        <Users className="h-5 w-5 text-blue-600" />
                      ) : user.role === 'school' ? (
                        <Building className="h-5 w-5 text-green-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isActive, user.isVerified)}`}>
                        {user.isActive ? (user.isVerified ? 'Active & Verified' : 'Active') : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {formatDate(user.createdAt)}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewUserDetails(user._id)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {user.isActive ? (
                    <button
                      onClick={() => updateUserStatus(user._id, { isActive: false })}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Deactivate User"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUserStatus(user._id, { isActive: true })}
                      className="p-2 text-gray-400 hover:text-green-600"
                      title="Activate User"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                  )}
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
                <span className="ml-2 text-sm text-gray-600">Loading more users...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreUsers}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Load More Users
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                  // Clear any query params when closing
                  if (searchParams.get('userId')) {
                    navigate('/admin/users', { replace: true });
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verified</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.user.isVerified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.user.createdAt)}</p>
                </div>
              </div>

              {selectedUser.profile && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.user.role === 'school' && selectedUser.profile.schoolName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.schoolName}</p>
                      </div>
                    )}
                    {selectedUser.user.role === 'teacher' && selectedUser.profile.personalInfo && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.personalInfo.firstName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.personalInfo.lastName}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                {selectedUser.user.isActive ? (
                  <button
                    onClick={() => updateUserStatus(selectedUser.user._id, { isActive: false })}
                    className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Deactivate User
                  </button>
                ) : (
                  <button
                    onClick={() => updateUserStatus(selectedUser.user._id, { isActive: true })}
                    className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Activate User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;


