import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, Building, Users, DollarSign, TrendingUp, Award } from 'lucide-react';
import { ratingApi } from '../api/ratingApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

// Define category icons outside the component to prevent re-creation on every render
const categoryIcons = {
  workEnvironment: Building,
  management: Users,
  salary: DollarSign,
  benefits: Award,
  careerGrowth: TrendingUp,
};

// Map internal category keys to display names
const categoryDisplayNames = {
  workEnvironment: 'Work Environment',
  management: 'Management',
  salary: 'Salary',
  benefits: 'Benefits',
  careerGrowth: 'Career Growth',
};

const SchoolRating = ({ schoolId, schoolName }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [ratings, setRatings] = useState(null);
  const [teacherRating, setTeacherRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [loadingAllRatings, setLoadingAllRatings] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('SchoolRating - showRatingForm state:', showRatingForm);
    console.log('SchoolRating - user role:', user?.role);
    console.log('SchoolRating - schoolId:', schoolId);
    console.log('SchoolRating - ratings:', ratings);
  }, [showRatingForm, user?.role, schoolId, ratings]);

  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    review: '',
    categories: {
      workEnvironment: 0,
      management: 0,
      salary: 0,
      benefits: 0,
      careerGrowth: 0
    },
    isAnonymous: false
  });

  // Load ratings data
  const loadRatings = async (loadAll = false) => {
    try {
      setLoading(true);
      console.log('Loading ratings for school:', schoolId, 'loadAll:', loadAll);

      const limit = loadAll ? 50 : 2; // Load only 2 ratings initially, more when viewing all

      const [schoolRatingsResponse, teacherRatingResponse] = await Promise.all([
        ratingApi.getSchoolRatings(schoolId, 1, limit),
        user?.role === 'teacher' ? ratingApi.getTeacherRating(schoolId) : Promise.resolve({ data: null })
      ]);

      console.log('School ratings response:', schoolRatingsResponse);
      console.log('Teacher rating response:', teacherRatingResponse);

      setRatings(schoolRatingsResponse.data);
      setTeacherRating(teacherRatingResponse.data);
    } catch (error) {
      console.error('Error loading ratings:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to load ratings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load ratings on mount
  useEffect(() => {
    if (schoolId) {
      loadRatings();
    }
  }, [schoolId, user]);

  // Update form when teacher rating is loaded
  useEffect(() => {
    if (teacherRating) {
      setRatingForm({
        rating: teacherRating.rating,
        review: teacherRating.review || '',
        categories: teacherRating.categories || {
          workEnvironment: 0,
          management: 0,
          salary: 0,
          benefits: 0,
          careerGrowth: 0
        },
        isAnonymous: teacherRating.isAnonymous || false
      });
    }
  }, [teacherRating]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (socket && schoolId) {
      // Join school rating room for real-time updates
      socket.emit('join_school_rating_room', schoolId);

      const handleRatingUpdate = (data) => {
        if (data.schoolId === schoolId) {
          console.log('Rating updated:', data);
          loadRatings(); // Reload ratings when updated
        }
      };

      socket.on('rating_updated', handleRatingUpdate);

      return () => {
        socket.emit('leave_school_rating_room', schoolId);
        socket.off('rating_updated', handleRatingUpdate);
      };
    }
  }, [socket, schoolId]);

  // Handle rating form submission
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    console.log('Submitting rating:', { schoolId, ratingForm });

    if (ratingForm.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!schoolId) {
      toast.error('School ID is missing');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Calling ratingApi.submitRating...');

      const result = await ratingApi.submitRating({
        schoolId,
        ...ratingForm
      });

      console.log('Rating submission result:', result);
      toast.success(teacherRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      setShowRatingForm(false);
      setRatingForm({
        rating: 0,
        review: '',
        categories: {
          workEnvironment: 0,
          management: 0,
          salary: 0,
          benefits: 0,
          careerGrowth: 0
        },
        isAnonymous: false
      });

      // Reload ratings after successful submission
      loadRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Failed to submit rating: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle rating form changes
  const handleRatingChange = (field, value) => {
    setRatingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (category, value) => {
    setRatingForm(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  // Render star rating
  const renderStars = (rating, interactive = false, onChange = null) => {
    // Ensure rating is a number and is within 0-5
    const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= roundedRating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Render category rating (used in the form)
  const renderCategoryRating = (label, value, onChange) => {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {renderStars(value, true, onChange)}
      </div>
    );
  };

  // Render a single category's average breakdown (used for display)
  const renderCategoryBreakdown = (categoryKey, categoryValue) => {
    // Only show categories that have been rated (value > 0)
    if (categoryValue <= 0) return null;

    const Icon = categoryIcons[categoryKey];
    const label = categoryDisplayNames[categoryKey];
    
    return (
      <div className="flex items-center justify-between gap-3 min-w-0">
        {/* Category Icon and Label (takes remaining space) */}
        <span className="text-sm text-gray-600 flex items-center min-w-0 flex-1">
          {Icon && <Icon className="w-4 h-4 mr-3 flex-shrink-0" />}
          <span className="truncate">{label}</span>
        </span>
        
        {/* Stars and Value Group (fixed width, right-aligned) */}
        <div className="flex items-center space-x-2 flex-shrink-0 min-w-[100px] justify-end">
          {renderStars(Math.round(categoryValue))}
          {/* Ensure the value is displayed with one decimal point for consistency */}
          <span className="text-sm font-medium text-gray-500">{categoryValue.toFixed(1)}</span>
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Show error state with retry button
  if (!ratings && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500 py-8">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="mb-2">Failed to load ratings</p>
          <p className="text-sm mb-4">There was an error loading the school ratings.</p>
          <button
            onClick={loadRatings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state when no ratings exist
  if (ratings && ratings.averageRating && ratings.averageRating.totalRatings === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500 py-8">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="mb-2">No ratings yet</p>
          <p className="text-sm">Be the first to rate this school!</p>
          {user?.role === 'teacher' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Rate School button clicked');
                setShowRatingForm(true);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rate School
            </button>
          )}
        </div>
      </div>
    );
  }

  const { averageRating, pagination } = ratings || {
    averageRating: { averageRating: 0, totalRatings: 0 },
    pagination: { total: 0 }
  };

  const totalRatings = pagination?.total || 0;

  // List of category keys to iterate over
  const categoryKeys = ['workEnvironment', 'management', 'salary', 'benefits', 'careerGrowth'];

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-hidden max-w-full">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Star className="w-5 h-5 text-yellow-400 mr-2" />
            School Rating
          </h3>
          {user?.role === 'teacher' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {teacherRating && (
                <span className="text-sm text-green-600 font-medium whitespace-nowrap">
                  Your rating: {teacherRating.rating}/5
                </span>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Rate School header button clicked');
                  setShowRatingForm(!showRatingForm);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium text-left sm:text-right whitespace-nowrap"
              >
                {teacherRating ? 'Update Rating' : 'Rate School'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overall Rating */}
      <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6 mb-6">
        <div className="text-center lg:text-left flex-shrink-0">
          {/* Ensure overall rating is displayed with one decimal point */}
          <div className="text-3xl font-bold text-gray-900">{(averageRating.averageRating || 0).toFixed(1)}</div> 
          {renderStars(Math.round(averageRating.averageRating || 0))}
          <div className="text-sm text-gray-500 mt-1">
            {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </div>
        </div>

        {/* Category Breakdown (FIXED LAYOUT) */}
        <div className="flex-1 space-y-2 min-w-0">
          {categoryKeys.map(key => renderCategoryBreakdown(key, averageRating[key] || 0))}
        </div>
      </div>

      {/* Rating Form */}
      {showRatingForm && user?.role === 'teacher' && (
        <div className="border-t pt-6 bg-yellow-50 p-4 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Rate This School</h4>
            <button
              onClick={() => setShowRatingForm(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmitRating} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              {renderStars(ratingForm.rating, true, (rating) => handleRatingChange('rating', rating))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category Ratings
              </label>
              {renderCategoryRating(categoryDisplayNames.workEnvironment, ratingForm.categories.workEnvironment, (rating) => handleCategoryChange('workEnvironment', rating))}
              {renderCategoryRating(categoryDisplayNames.management, ratingForm.categories.management, (rating) => handleCategoryChange('management', rating))}
              {renderCategoryRating(categoryDisplayNames.salary, ratingForm.categories.salary, (rating) => handleCategoryChange('salary', rating))}
              {renderCategoryRating(categoryDisplayNames.benefits, ratingForm.categories.benefits, (rating) => handleCategoryChange('benefits', rating))}
              {renderCategoryRating(categoryDisplayNames.careerGrowth, ratingForm.categories.careerGrowth, (rating) => handleCategoryChange('careerGrowth', rating))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={ratingForm.review}
                onChange={(e) => handleRatingChange('review', e.target.value)}
                placeholder="Share your experience working at this school..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {ratingForm.review.length}/500 characters
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={ratingForm.isAnonymous}
                onChange={(e) => handleRatingChange('isAnonymous', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                Submit anonymously
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={submitting || ratingForm.rating === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : (teacherRating ? 'Update Rating' : 'Submit Rating')}
              </button>
              <button
                type="button"
                onClick={() => setShowRatingForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Reviews */}
      {ratings.ratings && ratings.ratings.length > 0 && (
        <div className="border-t pt-6 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Recent Reviews</h4>
            {(ratings.ratings.length > 2 || totalRatings > 2) && (
              <button
                onClick={async () => {
                  if (!showAllRatings) {
                    // Load all ratings when first clicking "View All"
                    setLoadingAllRatings(true);
                    try {
                      await loadRatings(true);
                    } finally {
                      setLoadingAllRatings(false);
                    }
                  }
                  setShowAllRatings(!showAllRatings);
                }}
                disabled={loadingAllRatings}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
              >
                {loadingAllRatings ? 'Loading...' :
                  showAllRatings ? 'Show Less' :
                    `View All (${totalRatings})`}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {(showAllRatings ? ratings.ratings : ratings.ratings.slice(0, 2)).map((rating) => (
              <div key={rating._id} className="bg-gray-50 rounded-lg p-3 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    {renderStars(rating.rating)}
                    <span className="text-sm text-gray-500 truncate">
                      {rating.isAnonymous ? 'Anonymous' :
                        rating.teacher?.teacherProfile?.personalInfo?.firstName ?
                          `${rating.teacher.teacherProfile.personalInfo.firstName} ${rating.teacher.teacherProfile.personalInfo.lastName || ''}`.trim() :
                          'Teacher'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {rating.review && (
                  <p className="text-sm text-gray-700 break-words overflow-wrap-anywhere">{rating.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolRating;