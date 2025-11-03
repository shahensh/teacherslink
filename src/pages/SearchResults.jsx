import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, User, Building2, Filter, ArrowLeft, ShieldCheck } from 'lucide-react';
import { searchApi } from '../api/searchApi';
import { useAuth } from '../context/AuthContext';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'teachers', 'schools'
  
  useEffect(() => {
    if (query.trim()) {
      performSearch(query, 1, true);
    }
  }, [query, filter]);

  const performSearch = async (searchQuery, pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      let response;
      
      if (filter === 'teachers') {
        response = await searchApi.searchTeachers(searchQuery, pageNum, 12);
      } else if (filter === 'schools') {
        response = await searchApi.searchSchools(searchQuery, pageNum, 12);
      } else {
        response = await searchApi.searchProfiles(searchQuery, pageNum, 12);
      }

      if (response.success) {
        const newResults = response.profiles || [];
        
        if (reset) {
          setResults(newResults);
          setPage(1);
        } else {
          setResults(prev => [...prev, ...newResults]);
        }
        
        setHasMore(newResults.length === 12);
        setPage(pageNum + 1);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile) => {
    if (profile.type === 'teacher') {
      // Handle admin users - navigate to admin teacher profile page
      if (user?.role === 'admin') {
        navigate(`/admin/teacher/profile/${profile.slug || profile._id}`);
      } else if (user?.role === 'teacher') {
        navigate(`/teacher/profile/${profile.slug || profile._id}`);
      } else {
        navigate(`/school/teacher/profile/${profile.slug || profile._id}`);
      }
    } else if (profile.type === 'school') {
      // Handle admin users - navigate to admin school profile page
      if (user?.role === 'admin') {
        navigate(`/admin/school/profile/${profile.slug || profile._id}`);
      } else if (user?.role === 'teacher') {
        navigate(`/teacher/school/profile/${profile.slug || profile._id}`);
      } else {
        navigate(`/school/profile/${profile.slug || profile._id}`);
      }
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setResults([]);
    setPage(1);
    setHasMore(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      performSearch(query, page);
    }
  };

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const renderProfileCard = (profile) => (
    <div
      key={profile._id}
      onClick={() => handleProfileClick(profile)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <img
            src={profile.profileImage || '/default-avatar.png'}
            alt={profile.name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {profile.name}
            </h3>
            {/* Premium Verification Badge for Schools and Teachers */}
            {profile.plan?.isPremium && profile.plan?.expiresAt && new Date(profile.plan.expiresAt) > new Date() && (
              <span className="inline-flex items-center gap-1 text-blue-600 text-xs">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
            <span className="inline-flex items-center text-xs font-medium text-gray-500">
              {profile.type === 'teacher' ? 'Teacher' : 'School'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>@{profile.slug || 'user'}</span>
            <span>•</span>
            <span>Joined {formatJoinedDate(profile.createdAt)}</span>
          </div>
          
          {profile.bio && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Additional Info */}
          {profile.type === 'teacher' && profile.professionalInfo?.specialization && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {profile.professionalInfo.specialization.slice(0, 3).map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                  >
                    {subject}
                  </span>
                ))}
                {profile.professionalInfo.specialization.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    +{profile.professionalInfo.specialization.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {profile.type === 'school' && profile.location && (
            <div className="mt-2 text-sm text-gray-500">
              📍 {profile.location}
            </div>
          )}
        </div>

        {/* Type Icon */}
        <div className="flex-shrink-0">
          {profile.type === 'teacher' ? (
            <User className="w-5 h-5 text-blue-500" />
          ) : (
            <Building2 className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Profiles</h1>
            <p className="text-gray-600">Enter a search term to find teachers and schools</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            {results.length > 0 ? `${results.length} profiles found` : 'No profiles found'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('teachers')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'teachers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Teachers
              </button>
              <button
                onClick={() => handleFilterChange('schools')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'schools'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Schools
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && results.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No profiles found</h3>
            <p className="text-gray-600">Try searching with different keywords</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(renderProfileCard)}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
