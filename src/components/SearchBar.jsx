import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Building2, Clock } from 'lucide-react';
import { searchApi } from '../api/searchApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await searchApi.searchProfiles(searchQuery, 1, 8);
      if (response.success) {
        setResults(response.profiles || []);
        setSuggestions(response.suggestions || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim().length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleKeyDown = (e) => {
    const totalItems = results.length + suggestions.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < totalItems - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        const allItems = [...results, ...suggestions];
        const selectedItem = allItems[selectedIndex];
        if (selectedItem) {
          handleProfileClick(selectedItem);
        }
      } else if (query.trim()) {
        // Navigate to search results page
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setShowResults(false);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
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
    setShowResults(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const renderProfileItem = (profile, index, isSuggestion = false) => {
    const isSelected = selectedIndex === index + (isSuggestion ? results.length : 0);
    
    return (
      <div
        key={`${profile._id}-${isSuggestion ? 'suggestion' : 'result'}`}
        className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
          isSelected ? 'bg-gray-100' : ''
        } ${isSuggestion ? 'border-l-2 border-blue-500' : ''}`}
        onClick={() => handleProfileClick(profile)}
      >
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <img
            src={profile.profileImage || '/default-avatar.png'}
            alt={profile.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">
              {profile.name}
            </h4>
            <span className="inline-flex items-center text-xs font-medium text-gray-500">
              {profile.type === 'teacher' ? 'Teacher' : 'School'}
            </span>
            {isSuggestion && (
              <span className="inline-flex items-center text-xs text-blue-600">
                <Clock className="w-3 h-3 mr-1" />
                Recent
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>@{profile.slug || 'user'}</span>
            <span>•</span>
            <span>Joined {formatJoinedDate(profile.createdAt)}</span>
          </div>
          
          {profile.bio && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {profile.bio}
            </p>
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
    );
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search teachers and schools..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && results.length === 0 && suggestions.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No profiles found</p>
              <p className="text-xs text-gray-400">Try a different search term</p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Profiles
              </div>
              {results.map((profile, index) => renderProfileItem(profile, index))}
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Recent Searches
              </div>
              {suggestions.map((profile, index) => renderProfileItem(profile, index, true))}
            </div>
          )}

          {/* View All Results */}
          {!isLoading && (results.length > 0 || suggestions.length > 0) && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                  setShowResults(false);
                }}
                className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors text-left"
              >
                View all results for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
