import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/adminApi';
import { 
  Building, 
  Search, 
  Filter, 
  RefreshCw, 
  Crown,
  Calendar,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Globe,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const ManageSchools = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plan: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    premium: 0,
    free: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    unverified: 0
  });

  // Fetch schools with current filters and pagination
  const fetchSchools = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      const response = await adminApi.getSchoolsWithSubscriptions(params);
      
      if (reset || page === 1) {
        setSchools(response.schools);
      } else {
        setSchools(prev => [...prev, ...response.schools]);
      }
      
      setPagination(response.pagination);
      
      // Calculate stats
      const totalSchools = response.schools.length;
      const premiumCount = response.schools.filter(s => s.isPremium).length;
      const freeCount = totalSchools - premiumCount;
      const activeCount = response.schools.filter(s => s.isActive !== false).length;
      const inactiveCount = totalSchools - activeCount;
      const verifiedCount = response.schools.filter(s => s.isVerified).length;
      const unverifiedCount = totalSchools - verifiedCount;
      
      setStats({
        total: response.pagination.total,
        premium: premiumCount,
        free: freeCount,
        active: activeCount,
        inactive: inactiveCount,
        verified: verifiedCount,
        unverified: unverifiedCount
      });

    } catch (error) {
      console.error('Error fetching schools:', error);
      setError(error.message || 'Failed to load schools');
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  // Load more schools
  const loadMore = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchSchools(pagination.page + 1);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSchools(1, true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ search: '', status: '', plan: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Refresh data
  const refreshData = () => {
    fetchSchools(1, true);
  };

  // View school details
  const viewSchool = (school) => {
    setSelectedSchool(school);
    setShowSchoolModal(true);
  };

  // Update school status
  const updateSchoolStatus = async (schoolId, statusData) => {
    try {
      await adminApi.updateUserStatus(schoolId, statusData);
      toast.success('School status updated successfully');
      refreshData();
    } catch (error) {
      console.error('Error updating school status:', error);
      toast.error('Failed to update school status');
    }
  };

  // Verify school
  const verifySchool = async (schoolId) => {
    try {
      await adminApi.verifySchool(schoolId);
      toast.success('School verified successfully');
      refreshData();
    } catch (error) {
      console.error('Error verifying school:', error);
      toast.error('Failed to verify school');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format subscription expiry
  const formatExpiry = (expiryDate) => {
    if (!expiryDate) return 'N/A';
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    return formatDate(expiryDate);
  };

  // Get status badge
  const getStatusBadge = (school) => {
    if (!school.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>;
    }
    
    if (school.isPremium) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </span>;
    }
    
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" />
      Free
    </span>;
  };

  // Get plan badge
  const getPlanBadge = (school) => {
    if (!school.isPremium) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Free Plan
      </span>;
    }
    
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {school.planTitle}
    </span>;
  };

  // Get verification badge
  const getVerificationBadge = (school) => {
    if (school.isVerified) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Shield className="w-3 h-3 mr-1" />
        Verified
      </span>;
    }
    
    if (school.isPremium) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Crown className="w-3 h-3 mr-1" />
        Auto-Verified
      </span>;
    }
    
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </span>;
  };

  useEffect(() => {
    fetchSchools(1, true);
  }, []);

  if (loading && schools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schools...</p>
        </div>
      </div>
    );
  }

  // Add error boundary
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading schools</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schools Management</h1>
              <p className="text-gray-600 mt-2">Manage school accounts and subscription data</p>
            </div>
            <button
              onClick={refreshData}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Crown className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-2xl font-bold text-gray-900">{stats.premium}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
              </div>
            </div>
          </div>

    <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="premium">Premium</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                  <input
                    type="text"
                    value={filters.plan}
                    onChange={(e) => handleFilterChange('plan', e.target.value)}
                    placeholder="Filter by plan name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear filters
              </button>
              <button
                onClick={applyFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Schools ({pagination.total})</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {schools.map((school) => (
              <div key={school._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Building className="w-6 h-6 text-gray-500" />
                      </div>
    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {school.schoolProfile?.schoolName || school.name || 'Unknown School'}
                        </h4>
                        {getStatusBadge(school)}
                        {getPlanBadge(school)}
                        {getVerificationBadge(school)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{school.email}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Joined: {formatDate(school.createdAt)}</span>
                        </div>
                        
                        {school.isPremium && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>Expires: {formatExpiry(school.planExpiresAt)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{school.schoolProfile?.address?.city || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewSchool(school)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {/* Auto-verification: Schools are verified when they purchase subscription */}
                    
                    <button
                      onClick={() => updateSchoolStatus(school._id, { isActive: !school.isActive })}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        school.isActive
                          ? 'text-red-700 bg-red-100 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {school.isActive ? (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {pagination.page < pagination.pages && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                    Loading more...
                  </div>
                ) : (
                  `Load More (${pagination.total - schools.length} remaining)`
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* School Details Modal */}
      {showSchoolModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">School Details</h3>
                <button
                  onClick={() => setShowSchoolModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">School Name</label>
                      <p className="text-sm text-gray-900">{selectedSchool.schoolProfile?.schoolName || selectedSchool.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedSchool.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900">{selectedSchool.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedSchool)}</div>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Subscription Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Plan</label>
                      <div className="mt-1">{getPlanBadge(selectedSchool)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Premium Status</label>
                      <p className="text-sm text-gray-900">{selectedSchool.isPremium ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedSchool.isPremium && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Expires At</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedSchool.planExpiresAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Expiry Status</label>
                          <p className="text-sm text-gray-900">{formatExpiry(selectedSchool.planExpiresAt)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* School Profile Info */}
                {selectedSchool.schoolProfile && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">School Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <p className="text-sm text-gray-900">{selectedSchool.schoolProfile.schoolName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <p className="text-sm text-gray-900">{selectedSchool.schoolProfile.address?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{selectedSchool.schoolProfile.contactInfo?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <p className="text-sm text-gray-900">{selectedSchool.schoolProfile.contactInfo?.website || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created At</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSchool.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSchool.updatedAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Verified</label>
                      <p className="text-sm text-gray-900">{selectedSchool.isVerified ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Active</label>
                      <p className="text-sm text-gray-900">{selectedSchool.isActive !== false ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowSchoolModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {/* Auto-verification: Schools are verified when they purchase subscription */}
                <button
                  onClick={() => updateSchoolStatus(selectedSchool._id, { isActive: !selectedSchool.isActive })}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedSchool.isActive
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                >
                  {selectedSchool.isActive ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchools;