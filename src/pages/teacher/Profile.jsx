import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Camera,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit3,
  Save,
  X,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Image,
  Video,
  BookOpen, // New icon for Subject/Specialization
  Users, // New icon for Grade Levels
  Calendar, // Used for Life Event
  ArrowLeft, // Back arrow icon
  Eye, // View resume icon
  ShieldCheck, // Premium badge icon
} from "lucide-react";

// Real imports
import { useAuth } from "../../context/AuthContext";
import { teacherApi } from "../../api/teacherApi";
import * as postApi from "../../api/postApi";
import { useSocialSocket } from "../../hooks/useSocialSocket";
import EditResumeModal from "../../components/EditResumeModal";
import PostModal from "../../components/PostModal";
import PostMenu from "../../components/PostMenu";


/**
 * Facebook-like Teacher Profile (Refactored from School Profile)
 */
const TeacherProfile = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocialSocket();
  const { id } = useParams(); // Get the profile ID from URL
  const navigate = useNavigate();

  // State variables adapted for a teacher
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsModal, setCommentsModal] = useState({ isOpen: false, postId: null, comments: [], loading: false });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, photos: [], currentIndex: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const isFetchingRef = useRef(false);

  // Check if the current user is the owner of this profile
  const isOwner = useMemo(() => {
    // If no user or teacher data, not owner
    if (!user || !teacher) {
      console.log('isOwner: false - missing user or teacher data');
      return false;
    }
    
    // Compare user._id with teacher.user (handle both populated and non-populated cases)
    const userId = user._id || user.id;
    const teacherUserId = teacher.user;
    
    // Handle case where teacher.user might be populated (object) or just an ID (string)
    const teacherUserIdToCompare = typeof teacherUserId === 'object' 
      ? teacherUserId._id || teacherUserId.id 
      : teacherUserId;
    
    console.log('isOwner check:', {
      userId: userId,
      teacherUserId: teacherUserId,
      teacherUserIdToCompare: teacherUserIdToCompare,
      userIdType: typeof userId,
      teacherUserIdType: typeof teacherUserId,
      userIdString: userId?.toString(),
      teacherUserIdString: teacherUserIdToCompare?.toString(),
      match: userId && teacherUserIdToCompare && userId.toString() === teacherUserIdToCompare.toString()
    });
    
    return userId && teacherUserIdToCompare && userId.toString() === teacherUserIdToCompare.toString();
  }, [user, teacher]);

  useEffect(() => {
    console.log('useEffect triggered - user:', user);
    console.log('useEffect triggered - id:', id);
    console.log('useEffect triggered - user.role:', user?.role);
    console.log('useEffect triggered - isFetching:', isFetchingRef.current);
    console.log('useEffect triggered - teacher state:', teacher);
    
    // If viewing another teacher's profile (id exists), allow any authenticated user
    // If viewing own profile, only allow teacher users
    if (user && (id || user.role === 'teacher') && !isFetchingRef.current) {
      console.log('Calling fetchTeacherProfile...');
      isFetchingRef.current = true;
      fetchTeacherProfile();
    } else {
      console.log('Not calling fetchTeacherProfile - conditions not met or already fetching');
      console.log('Conditions check:', {
        hasUser: !!user,
        hasId: !!id,
        isTeacher: user?.role === 'teacher',
        notFetching: !isFetchingRef.current
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);
  
  // Real-time event listeners (simplified for this snippet)
  useEffect(() => {
    if (!socket || !isConnected || !teacher?._id) return;
    // Real-time listeners logic goes here, similar to the original,
    // but filtered for this teacher's profile ID
  }, [socket, isConnected, teacher?._id, user?._id]);

  // Add keyboard event listener for photo viewer
  useEffect(() => {
    if (photoViewer.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [photoViewer.isOpen]);


  const fetchTeacherProfile = async () => {
    try {
      console.log('fetchTeacherProfile called - id:', id);
      setLoading(true);
      
      // If id parameter exists, fetch that specific teacher's profile
      // Otherwise, fetch the current user's own profile
      const response = id ? await teacherApi.getProfileById(id) : await teacherApi.getProfile();
      if (response.success) {
        const fetchedTeacher = response.teacher; // Changed data key
        console.log('Fetched teacher profile:', fetchedTeacher);
        console.log('Profile image URL:', fetchedTeacher.personalInfo?.profileImage);
        console.log('Profile photo URL:', fetchedTeacher.personalInfo?.profilePhoto);
        console.log('Cover image URL:', fetchedTeacher.personalInfo?.coverImage);
        console.log('User field:', fetchedTeacher.user);
        console.log('User email:', fetchedTeacher.user?.email);
        console.log('Personal info email:', fetchedTeacher.personalInfo?.email);
        
        // Always update the profile to ensure we have the latest data
        console.log('Setting teacher profile...');
        setTeacher(fetchedTeacher);
        // Normalize specialization arrays to strings for easier form editing
        setFormData({
          ...fetchedTeacher,
          personalInfo: {
            ...fetchedTeacher.personalInfo,
            address: {
              ...fetchedTeacher.personalInfo?.address,
              city: fetchedTeacher.personalInfo?.address?.city || '',
              state: fetchedTeacher.personalInfo?.address?.state || '',
              street: fetchedTeacher.personalInfo?.address?.street || '',
              pincode: fetchedTeacher.personalInfo?.address?.pincode || '',
              country: fetchedTeacher.personalInfo?.address?.country || 'India'
            },
            specialization: fetchedTeacher.professionalInfo?.specialization?.join(', ') || '',
            gradeLevels: fetchedTeacher.professionalInfo?.gradeLevels?.join(', ') || '',
          },
          professionalInfo: {
            ...fetchedTeacher.professionalInfo,
            specialization: fetchedTeacher.professionalInfo?.specialization?.join(', ') || '',
            gradeLevels: fetchedTeacher.professionalInfo?.gradeLevels?.join(', ') || '',
          }
        });

        // Fetch posts for this teacher profile
        const postsResponse = await postApi.getProfilePosts(fetchedTeacher._id);
        if (postsResponse.success) {
          setPosts(postsResponse.posts || []);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      
      if (error.response?.status === 404) {
        toast.error("Teacher profile not found");
      } else if (error.response?.status === 403) {
        toast.error("Access denied");
      } else if (error.response?.status === 401) {
        toast.error("Please log in again");
      } else {
        toast.error("Failed to load teacher profile");
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested object properties (e.g., personalInfo.address.city)
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData((prev) => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the nested object
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Set the final value
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Check username availability when slug changes
    if (name === 'slug') {
      checkUsernameAvailability(value);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data for API: convert specialization strings back to arrays if they exist
      const dataToSave = {
        ...formData,
        personalInfo: {
          ...formData.personalInfo,
          // Convert specialization and gradeLevels back to arrays if they're strings
          ...(formData.personalInfo?.specialization && typeof formData.personalInfo.specialization === 'string' 
            ? { specialization: formData.personalInfo.specialization.split(',').map(s => s.trim()).filter(s => s) }
            : {}),
          ...(formData.personalInfo?.gradeLevels && typeof formData.personalInfo.gradeLevels === 'string'
            ? { gradeLevels: formData.personalInfo.gradeLevels.split(',').map(g => g.trim()).filter(g => g) }
            : {})
        },
        professionalInfo: {
          ...formData.professionalInfo,
          // Convert specialization and gradeLevels back to arrays if they're strings
          ...(formData.professionalInfo?.specialization && typeof formData.professionalInfo.specialization === 'string'
            ? { specialization: formData.professionalInfo.specialization.split(',').map(s => s.trim()).filter(s => s) }
            : {}),
          ...(formData.professionalInfo?.gradeLevels && typeof formData.professionalInfo.gradeLevels === 'string'
            ? { gradeLevels: formData.professionalInfo.gradeLevels.split(',').map(g => g.trim()).filter(g => g) }
            : {})
        }
      };

      const response = await teacherApi.updateProfile(dataToSave);

      if (response.success) {
        setTeacher(response.teacher);
        setEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert formData back to the state of the teacher object
    setFormData({
      ...teacher,
      personalInfo: {
        ...teacher.personalInfo,
        address: {
          ...teacher.personalInfo?.address,
          city: teacher.personalInfo?.address?.city || '',
          state: teacher.personalInfo?.address?.state || '',
          street: teacher.personalInfo?.address?.street || '',
          pincode: teacher.personalInfo?.address?.pincode || '',
          country: teacher.personalInfo?.address?.country || 'India'
        },
        specialization: teacher.professionalInfo?.specialization?.join(', ') || '',
        gradeLevels: teacher.professionalInfo?.gradeLevels?.join(', ') || '',
      },
      professionalInfo: {
        ...teacher.professionalInfo,
        specialization: teacher.professionalInfo?.specialization?.join(', ') || '',
        gradeLevels: teacher.professionalInfo?.gradeLevels?.join(', ') || '',
      }
    });
    setEditing(false);
    setUsernameAvailability(null);
  };

  // --- Utility functions ---
  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `Joined on ${d.toLocaleString(undefined, { month: "long", year: "numeric", day: "numeric" })}`;
  };
  const formatDateTime = (dateStr) => {
    // Simplified, use relative time for Facebook look
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  // --- Post Logic (Simplified/Adapted) ---
  const handleNewPost = useCallback(async (postData) => {
    if (!postData.caption.trim() && !postData.media.length) {
      toast.error("Post cannot be empty.");
      return;
    }

    try {
      const response = await postApi.createPost({
        ...postData,
        privacy: 'public'
      });

      if (response.success) {
        setPosts(prev => [response.post, ...prev]);
        setIsPostModalOpen(false);
        toast.success("Post created successfully!");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  }, []);

  // Delete post function
  const handleDeletePost = useCallback(async (postId) => {
    try {
      await postApi.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  }, []);

  // Media upload is now handled by PostModal component
  
  const submitComment = async (postId) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    try {
      const response = await postApi.addComment(postId, text);
      if (response.success) {
        setPosts(prev =>
          prev.map(post =>
            post._id === postId
              ? {
                  ...post,
                  commentsCount: (post.commentsCount || 0) + 1
                }
              : post
          )
        );

        setCommentDrafts((s) => ({ ...s, [postId]: "" }));

        // If comments modal is open for this post, refresh the comments
        if (commentsModal.isOpen && commentsModal.postId === postId) {
          try {
            const response = await postApi.getComments(postId);
            if (response.success) {
              setCommentsModal(prev => ({
                ...prev,
                comments: response.comments || []
              }));
            }
          } catch (error) {
            console.error('Error refreshing comments:', error);
          }
        }

        toast.success("Comment added successfully");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const onCommentChange = (postId, value) => {
      setCommentDrafts((s) => ({ ...s, [postId]: value }));
  };

  const handleNativeShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: post.caption || 'Shared from TeachersLink',
          url: `${window.location.origin}/post/${post._id}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
        toast.success("Post link copied to clipboard!");
      }
      
      // Update share count
      await postApi.sharePost(post._id);
      setPosts(prev => 
        prev.map(p => 
          p._id === post._id 
            ? { ...p, sharesCount: (p.sharesCount || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    }
  };

  // Open comments modal and fetch comments
  const openCommentsModal = async (postId) => {
    setCommentsModal({
      isOpen: true,
      postId,
      comments: [],
      loading: true
    });

    try {
      const response = await postApi.getComments(postId);
      if (response.success) {
        setCommentsModal(prev => ({
          ...prev,
          comments: response.comments || [],
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      setCommentsModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  // Close comments modal
  const closeCommentsModal = () => {
    setCommentsModal({
      isOpen: false,
      postId: null,
      comments: [],
      loading: false
    });
  };

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    // This will be handled by the PostModal component
  }, []);

  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Close emoji picker when clicking outside
  const handleEmojiPickerClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowEmojiPicker(false);
    }
  };

  // Open photo viewer
  const openPhotoViewer = (photos, currentIndex = 0) => {
    setPhotoViewer({
      isOpen: true,
      photos,
      currentIndex
    });
  };

  // Close photo viewer
  const closePhotoViewer = () => {
    setPhotoViewer({
      isOpen: false,
      photos: [],
      currentIndex: 0
    });
  };

  // Navigate to next photo
  const nextPhoto = () => {
    setPhotoViewer(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  // Navigate to previous photo
  const prevPhoto = () => {
    setPhotoViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!photoViewer.isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        closePhotoViewer();
        break;
      case 'ArrowLeft':
        prevPhoto();
        break;
      case 'ArrowRight':
        nextPhoto();
        break;
      default:
        break;
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailability(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await teacherApi.checkUsername(username);
      setUsernameAvailability(response);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailability({
        available: false,
        message: 'Error checking username availability'
      });
    } finally {
      setCheckingUsername(false);
    }
  };

  // --- Image Uploads ---
  
  // Debug effect to watch for profile image changes
  useEffect(() => {
    console.log('Profile image changed:', {
      profileImage: teacher?.personalInfo?.profileImage,
      profilePhoto: teacher?.personalInfo?.profilePhoto,
      coverImage: teacher?.personalInfo?.coverImage
    });
  }, [teacher?.personalInfo?.profileImage, teacher?.personalInfo?.profilePhoto, teacher?.personalInfo?.coverImage]);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Uploading profile image:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await teacherApi.uploadProfileImage(formData);
      
      console.log('Upload response:', response);
      console.log('Current teacher state before update:', teacher);
      console.log('Response success:', response.success);
      console.log('Response profileImage:', response.profileImage);
      
      if (response.success) {
        // Ensure the URL is properly formatted
        const imageUrl = response.profileImage;
        console.log('Raw image URL from response:', imageUrl);
        console.log('URL type:', typeof imageUrl);
        console.log('URL length:', imageUrl?.length);
        console.log('URL starts with https:', imageUrl?.startsWith('https://'));
        console.log('URL is valid:', imageUrl && imageUrl.length > 0);
        console.log('URL contains cloudinary:', imageUrl?.includes('cloudinary'));
        console.log('Full response object:', response);
        
        const updatedTeacher = { 
          ...teacher, 
          personalInfo: {
            ...teacher.personalInfo,
            profileImage: imageUrl,
            profilePhoto: imageUrl
          }
        };
        console.log('Updated teacher state:', updatedTeacher);
        console.log('New profile image URL:', imageUrl);
        console.log('Updated personalInfo:', updatedTeacher.personalInfo);
        setTeacher(updatedTeacher);
        toast.success("Profile image updated successfully");
        
        // Refetch the profile to ensure we have the latest data
        setTimeout(() => {
          console.log('Refetching profile after image upload...');
          isFetchingRef.current = false; // Reset the ref to allow refetch
          fetchTeacherProfile();
        }, 1000);
      } else {
        toast.error(response.message || "Failed to upload profile image");
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to upload profile image");
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Uploading cover image:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    try {
      const formData = new FormData();
      formData.append('coverImage', file);
      const response = await teacherApi.uploadCoverImage(formData);
      
      console.log('Cover upload response:', response);
      console.log('Current teacher state before cover update:', teacher);
      console.log('Cover response success:', response.success);
      console.log('Cover response coverImage:', response.coverImage);
      
      if (response.success) {
        // Ensure the URL is properly formatted
        const coverUrl = response.coverImage;
        console.log('Raw cover URL from response:', coverUrl);
        console.log('Cover URL type:', typeof coverUrl);
        console.log('Cover URL length:', coverUrl?.length);
        console.log('Cover URL starts with https:', coverUrl?.startsWith('https://'));
        console.log('Cover URL is valid:', coverUrl && coverUrl.length > 0);
        console.log('Cover URL contains cloudinary:', coverUrl?.includes('cloudinary'));
        console.log('Full cover response object:', response);
        
        const updatedTeacher = { 
          ...teacher, 
          personalInfo: {
            ...teacher.personalInfo,
            coverImage: coverUrl
          }
        };
        console.log('Updated teacher state with cover:', updatedTeacher);
        console.log('New cover image URL:', coverUrl);
        console.log('Updated personalInfo with cover:', updatedTeacher.personalInfo);
        setTeacher(updatedTeacher);
        toast.success("Cover image updated successfully");
        
        // Refetch the profile to ensure we have the latest data
        setTimeout(() => {
          console.log('Refetching profile after cover upload...');
          isFetchingRef.current = false; // Reset the ref to allow refetch
          fetchTeacherProfile();
        }, 1000);
      } else {
        toast.error(response.message || "Failed to upload cover image");
      }
    } catch (error) {
      console.error('Cover upload error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to upload cover image");
    }
  };


  // PostModal is now imported as a separate component


  const renderPostsContent = () => {
    if (posts.length === 0) {
      return <div className="text-center text-gray-500 py-10">No posts yet</div>;
    }
    
    return posts.map((post) => (
        <article key={post._id} className="bg-white rounded-md shadow-sm border border-gray-100 mb-4">
            <div className="flex items-start gap-3 px-4 py-3">
                <img src={(teacher.personalInfo?.profileImage && teacher.personalInfo.profileImage.trim() !== '') || (teacher.personalInfo?.profilePhoto && teacher.personalInfo.profilePhoto.trim() !== '') ? (teacher.personalInfo?.profileImage || teacher.personalInfo?.profilePhoto) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEMyMCA2NS42NDA2IDMyLjY0MDYgNTMgNDcgNTNINjNDNzcuMzU5NCA1MyA5MCA2NS42NDA2IDkwIDgwVjEwMEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'} alt="teacher" className="w-11 h-11 rounded-full object-cover" />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900">{teacher?.fullName || 'Loading...'}</div>
                                {/* Premium Badge on Posts */}
                                {teacher?.user?.plan?.isPremium && teacher?.user?.plan?.expiresAt && new Date(teacher.user.plan.expiresAt) > new Date() && (
                                  <span className="inline-flex items-center gap-1 text-blue-600 text-xs">
                                    <ShieldCheck className="w-3 h-3"/> Verified
                                  </span>
                                )}
                                <span className="inline-flex items-center text-xs font-medium text-gray-500">
                                    Teacher
                                </span>
                            </div>
                            <div className="text-xs text-gray-500">{formatDateTime(post.createdAt)}</div>
                        </div>
                        <PostMenu 
                          post={post} 
                          onDelete={handleDeletePost}
                          isOwner={post.author._id === user?.id}
                        />
                    </div>
                    {post.caption && <p className="mt-3 text-gray-800 whitespace-pre-wrap">{post.caption}</p>}
                    
                    {/* Post Media */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-3">
                        {post.media[0].type === 'video' ? (
                          <video 
                            src={post.media[0].url} 
                            className="w-full max-h-[480px] object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg" 
                            controls
                            preload="metadata"
                            onClick={(e) => {
                              e.preventDefault();
                              // Open video in fullscreen or modal
                              window.open(post.media[0].url, '_blank');
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img 
                            src={post.media[0].url} 
                            className="w-full max-h-[480px] object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg" 
                            alt="post media"
                            onClick={() => openPhotoViewer(post.media, 0)}
                          />
                        )}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="mt-3 border-t pt-2 flex gap-2">
                      <button 
                        onClick={() => openCommentsModal(post._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Comment
                        {post.commentsCount > 0 && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                            {post.commentsCount}
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={() => handleNativeShare(post)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                        {post.sharesCount > 0 && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                            {post.sharesCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Comment Input */}
                    <div className="mt-3 border-t pt-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={teacher.personalInfo?.profileImage || teacher.personalInfo?.profilePhoto} 
                          alt="me" 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4">
                          <input
                            id={`comment-${post._id}`}
                            type="text"
                            value={commentDrafts[post._id] || ""}
                            onChange={(e) => onCommentChange(post._id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && commentDrafts[post._id]?.trim()) {
                                submitComment(post._id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="w-full py-2 bg-transparent text-sm focus:outline-none"
                          />
                          <button
                            onClick={() => submitComment(post._id)}
                            disabled={!commentDrafts[post._id]?.trim()}
                            className={`ml-2 px-3 py-1 text-xs rounded-full transition-colors ${
                              commentDrafts[post._id]?.trim() 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        </article>
    ));
  };


  const renderAboutContent = () => (
    <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold mb-4">About {teacher?.fullName || 'Loading...'}</h2>
      
      <p className="text-gray-700 mb-6 whitespace-pre-wrap">{teacher.personalInfo?.bio || "The teacher has not provided a detailed description yet."}</p>

      <h3 className="text-lg font-semibold mb-3 border-b pb-1">Contact Information</h3>
      
      <div className="text-sm text-gray-600 space-y-3">
        <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-600"/> <strong>Address:</strong> {teacher.personalInfo?.address?.street || "Street"}, {teacher.personalInfo?.address?.city || "City"}, {teacher.personalInfo?.address?.state || "State"}</div>
        <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-blue-600"/> <strong>Phone:</strong> {teacher.personalInfo?.phone || "N/A"}</div>
        <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-600"/> <strong>Email:</strong> <a href={`mailto:${teacher?.user?.email || teacher?.personalInfo?.email}`} className="text-blue-600 hover:underline">{teacher?.user?.email || teacher?.personalInfo?.email || "N/A"}</a></div>
        <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-blue-600"/> <strong>Specialization:</strong> {teacher.professionalInfo?.specialization?.join(', ') || "N/A"}</div>
        <div className="flex items-center gap-3"><Users className="w-5 h-5 text-blue-600"/> <strong>Grade Levels:</strong> {teacher.professionalInfo?.gradeLevels?.join(', ') || "N/A"}</div>
      </div>

      <div className="mt-6 text-sm text-gray-500 border-t pt-3">
        <p>{formatJoinedDate(teacher.createdAt)}</p>
      </div>
    </div>
  );

  const ProfileInfoItem = ({ icon: Icon, label, value, name, isEditing, onChange, placeholder = "" }) => (
    <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-500 w-28">{label}:</span>
        {isEditing ? (
            <input
                type="text"
                name={name}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder || `Enter ${label}`}
                className="flex-1 border rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
        ) : (
            <span className="text-sm text-gray-800 flex-1">{value || 'N/A'}</span>
        )}
    </div>
  );

  const renderMediaContent = () => {
    // Get all media from posts
    const allMedia = posts.reduce((acc, post) => {
      if (post.media && post.media.length > 0) {
        return [...acc, ...post.media];
      }
      return acc;
    }, []);

    if (allMedia.length === 0) {
  return (
        <div className="text-center text-gray-500 py-12">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-lg font-medium mb-2">No photos yet</p>
          <p className="text-sm">Photos and videos will appear here</p>
    </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {allMedia.map((media, index) => (
          <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
            {media.type === 'video' ? (
              <video 
                src={media.url} 
                alt={`Video ${index + 1}`} 
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                controls
                preload="metadata"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(media.url, '_blank');
                }}
              />
            ) : (
              <img 
                src={media.url} 
                alt={`Media ${index + 1}`} 
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openPhotoViewer([media], 0)}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReviewsContent = () => {
    // For now, show a placeholder since teachers don't have reviews from schools
    return (
      <div className="text-center text-gray-500 py-12">
        <div className="text-6xl mb-4">⭐</div>
        <p className="text-lg font-medium mb-2">No reviews yet</p>
        <p className="text-sm">Reviews from schools and students will appear here</p>
      </div>
    );
  };

  const renderContent = () => {
    // Debug logging
    console.log('Teacher Profile Debug:', {
      user: user,
      teacher: teacher,
      userRole: user?.role,
      userId: user?.id,
      userEmail: user?.email,
      teacherId: teacher?._id,
      isOwner: isOwner
    });

    switch (activeTab) {
      case "about":
        return renderAboutContent();
      case "media":
        return renderMediaContent();
      case "reviews":
        return renderReviewsContent();
      case "posts":
      default:
        return (
          <>
            {/* *** CREATE POST CARD - Only show for profile owner *** */}
            {(isOwner || (!id && user?.role === 'teacher')) && (
              <div className="bg-white rounded-md p-4 mb-4 border border-gray-100 shadow-sm">
                {/* Top Row: Profile Image & "What's on your mind?" Input-like button */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <img src={teacher.personalInfo?.profileImage || teacher.personalInfo?.profilePhoto} alt="me" className="w-10 h-10 rounded-full object-cover" />
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex-1 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-500 text-left hover:bg-gray-100 transition-colors"
                  >
                    What's on your mind?
                  </button>
                </div>

                {/* Bottom Row: Action Buttons */}
                <div className="mt-3 flex justify-between gap-2">
                  {/* Live Video */}
                  {/* <button onClick={() => setIsPostModalOpen(true)} className="flex items-center justify-center flex-1 gap-1 text-red-600 hover:bg-gray-50 p-2 rounded-md transition-colors text-sm">
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Live video</span>
                  </button> */}

                  {/* Photo/Image only */}
                  <button onClick={() => setIsPostModalOpen(true)} className="flex items-center justify-center flex-1 gap-1 text-green-600 hover:bg-gray-50 p-2 rounded-md transition-colors text-sm">
                    <Image className="w-4 h-4" />
                    <span className="font-medium">Photo</span>
                  </button>

                  {/* Life Event */}
                  {/* <button onClick={() => setIsPostModalOpen(true)} className="flex items-center justify-center flex-1 gap-1 text-blue-600 hover:bg-gray-50 p-2 rounded-md transition-colors text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Life event</span>
                  </button> */}
                </div>
              </div>
            )}
            {renderPostsContent()}
          </>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  if (!teacher) {
    return <div className="text-center py-10 text-red-500">Error loading teacher profile or user is not a teacher.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        teacher={teacher}
        onPost={handleNewPost}
        onEmojiSelect={handleEmojiSelect}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={toggleEmojiPicker}
        onEmojiPickerClick={handleEmojiPickerClick}
        imageOnly={true}
      />

      {/* COVER */}
      <div className="relative w-full h-80 bg-gray-200">
        <img
          src={teacher.personalInfo?.coverImage && teacher.personalInfo.coverImage.trim() !== '' ? teacher.personalInfo.coverImage : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0wIDMwMEw4MDAgMEw4MDAgMzAwSDBaIiBmaWxsPSIjRTVFN0VCIi8+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Cover image failed to load:', e.target.src);
            console.log('Teacher personalInfo:', teacher.personalInfo);
            console.log('Cover image URL:', teacher.personalInfo?.coverImage);
            console.log('Available personalInfo fields:', Object.keys(teacher.personalInfo || {}));
            console.log('Full personalInfo object:', JSON.stringify(teacher.personalInfo, null, 2));
            // Set a fallback image
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0wIDMwMEw4MDAgMEw4MDAgMzAwSDBaIiBmaWxsPSIjRTVFN0VCIi8+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
          }}
          onLoad={() => {
            console.log('Cover image loaded successfully:', teacher.personalInfo?.coverImage);
            console.log('Cover image element src:', document.querySelector('img[alt="Cover"]')?.src);
          }}
        />
        
        {/* Back Arrow Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {editing && (
          <label className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-black/70 cursor-pointer">
            <Camera className="w-4 h-4" /> Change Cover
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* PROFILE INFO BOX (centered like FB) */}
      <div className="max-w-5xl mx-auto px-2">
        <div className="bg-white rounded-md shadow-sm border border-gray-100 -mt-20 relative z-10">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              {/* Profile Photo */}
              <div className="relative">
                <img
                  src={(teacher.personalInfo?.profileImage && teacher.personalInfo.profileImage.trim() !== '') || (teacher.personalInfo?.profilePhoto && teacher.personalInfo.profilePhoto.trim() !== '') ? (teacher.personalInfo?.profileImage || teacher.personalInfo?.profilePhoto) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEMyMCA2NS42NDA2IDMyLjY0MDYgNTMgNDcgNTNINjNDNzcuMzU5NCA1MyA5MCA2NS42NDA2IDkwIDgwVjEwMEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                  alt="Profile"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    console.log('Profile image failed to load:', e.target.src);
                    console.log('Teacher personalInfo:', teacher.personalInfo);
                    console.log('Available profile image URLs:', {
                      profileImage: teacher.personalInfo?.profileImage,
                      profilePhoto: teacher.personalInfo?.profilePhoto
                    });
                    // Set a fallback image
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEMyMCA2NS42NDA2IDMyLjY0MDYgNTMgNDcgNTNINjNDNzcuMzU5NCA1MyA5MCA2NS42NDA2IDkwIDgwVjEwMEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                  }}
                  onLoad={() => {
                    console.log('Profile image loaded successfully:', teacher.personalInfo?.profileImage || teacher.personalInfo?.profilePhoto);
                    console.log('Image element src:', document.querySelector('img[alt="Profile"]')?.src);
                  }}
                />
                {editing && (
                  <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {editing ? (
                  <div className="space-y-4">
                    {/* Edit Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="personalInfo.firstName"
                          value={formData.personalInfo?.firstName || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter first name"
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="personalInfo.lastName"
                          value={formData.personalInfo?.lastName || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">@</span>
                        </div>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug || ''}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="username"
                        />
                      </div>
                      {formData.slug && formData.slug.length >= 3 && (
                        <div className="mt-1">
                          {checkingUsername ? (
                            <span className="text-sm text-gray-500">Checking availability...</span>
                          ) : usernameAvailability ? (
                            <span className={`text-sm ${usernameAvailability.available ? 'text-green-600' : 'text-red-600'}`}>
                              {usernameAvailability.message}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="personalInfo.bio"
                        value={formData.personalInfo?.bio || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="personalInfo.phone"
                          value={formData.personalInfo?.phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="personalInfo.address.city"
                          value={formData.personalInfo?.address?.city || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          name="personalInfo.address.state"
                          value={formData.personalInfo?.address?.state || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="personalInfo.address.pincode"
                          value={formData.personalInfo?.address?.pincode || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="personalInfo.address.street"
                        value={formData.personalInfo?.address?.street || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter street address"
                      />
                    </div>

                    {/* Professional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          name="professionalInfo.specialization"
                          value={formData.professionalInfo?.specialization || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Math, Science, History (comma-separated)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade Levels
                        </label>
                        <input
                          type="text"
                          name="professionalInfo.gradeLevels"
                          value={formData.professionalInfo?.gradeLevels || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Middle School, High School (comma-separated)"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {teacher.fullName}
                      </h1>
                      {/* Premium Verification Badge */}
                      {teacher?.user?.plan?.isPremium && teacher?.user?.plan?.expiresAt && new Date(teacher.user.plan.expiresAt) > new Date() && (
                        <span className="inline-flex items-center gap-1 text-blue-600 text-sm">
                          <ShieldCheck className="w-5 h-5"/> Verified Premium
                        </span>
                      )}
                    </div>
                    
                    {/* Teacher Tag */}
                    <div className="flex items-center justify-center md:justify-start mb-2">
                      <span className="inline-flex items-center text-xs font-medium text-gray-600">
                        Teacher | Educator
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {teacher.personalInfo?.bio || 'Passionate educator dedicated to student success'}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
                      <span>@{teacher.slug || 'teacher'}</span>
                      <span>•</span>
                      <span>{formatJoinedDate(teacher.createdAt)}</span>
                    </div>
                    
                    {/* Email display */}
                    <div className="flex items-center justify-center md:justify-start mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{teacher?.user?.email || teacher?.personalInfo?.email || 'Loading...'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              {isOwner ? (
                // Teacher's own profile - show edit buttons
                <div className="flex-shrink-0">
                  {editing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-gray-400"
                      >
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center gap-2"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" /> Edit Profile
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const { resumeApi } = await import('../../api/resumeApi');
                            // For teachers viewing their own resume, use the /me/pdf endpoint
                            await resumeApi.viewMyResumePDF();
                          } catch (error) {
                            console.error('Error viewing resume:', error);
                            toast.error('Failed to view resume');
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" /> View Resume
                      </button>
                      <button
                        onClick={() => setIsResumeModalOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" /> Edit Resume
                      </button>
                    </div>
                  )}
                </div>
              ) : user?.role === 'school' || user?.role === 'admin' ? (
                // School or Admin viewing teacher profile - show resume and message buttons
                <div className="flex-shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const { resumeApi } = await import('../../api/resumeApi');
                          // For schools/admins viewing teacher resume, use the teacher ID endpoint
                          await resumeApi.viewTeacherResumePDF(teacher?._id);
                        } catch (error) {
                          console.error('Error viewing teacher resume:', error);
                          toast.error('Failed to view resume');
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 hover:bg-purple-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" /> View Resume
                    </button>
                    {user?.role === 'school' && (
                      <button
                        onClick={async () => {
                          try {
                            // Try to find an existing application with this teacher
                            const { applicationsApi } = await import('../../api/applicationsApi');
                            const applications = await applicationsApi.getApplications();
                            
                            // Find application for this teacher
                            const teacherApplication = applications.find(app => 
                              app.applicant._id === teacher?._id || 
                              app.applicant === teacher?._id
                            );
                            
                            if (teacherApplication) {
                              // Navigate to chat with specific application
                              navigate('/school/chat', {
                                state: {
                                  applicationId: teacherApplication._id,
                                  teacherId: teacher?._id,
                                  teacherName: teacher?.personalInfo?.firstName + ' ' + teacher?.personalInfo?.lastName,
                                  jobTitle: teacherApplication.job?.title || 'Position'
                                }
                              });
                            } else {
                              // No existing application, navigate to general chat
                              navigate('/school/chat');
                              toast.info('No existing conversation found. You can start a new conversation from the Messages page.');
                            }
                          } catch (error) {
                            console.error('Error finding conversation:', error);
                            // Fallback to general chat
                            navigate('/school/chat');
                            toast.info('Navigate to Messages to start a conversation with this teacher');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" /> Message Teacher
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-6">
          <div className="max-w-5xl mx-auto bg-white rounded-md shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex gap-4 overflow-x-auto whitespace-nowrap pb-1">
                {["posts", "about", "media", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`capitalize px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT LAYOUT: uses renderContent for dynamic tab display */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 px-2">
          {/* LEFT column (About summary & quick links) - Matches the uploaded screenshot layout */}
          <div className={`lg:col-span-1`}>
            <div className="sticky top-28 space-y-4">
              <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold mb-2">About</h3>
                <p className="text-sm text-gray-700 mb-2">{teacher.personalInfo?.bio || "No description provided."}</p>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {teacher.personalInfo?.address?.city || "City"}</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4"/> {teacher.personalInfo?.phone || "Phone"}</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4"/> {teacher?.user?.email || teacher?.personalInfo?.email || "Email"}</div>
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4"/> {teacher.professionalInfo?.specialization?.join(', ') || "Specialization"}</div>
                </div>
              </div>

              <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold mb-2">Recent Photos</h3>
                {(() => {
                  // Get recent photos from posts
                  const recentPhotos = posts.reduce((acc, post) => {
                    if (post.media && post.media.length > 0) {
                      return [...acc, ...post.media.slice(0, 2)]; // Take first 2 photos from each post
                    }
                    return acc;
                  }, []).slice(0, 6); // Show max 6 photos

                  return recentPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1">
                      {recentPhotos.map((photo, i) => (
                        <img 
                          key={i} 
                          src={photo.url} 
                          alt="Recent photo" 
                          className="w-full h-20 object-cover rounded-sm" 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <div className="text-2xl mb-1">📷</div>
                      <p className="text-xs">No photos yet</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* CENTER FEED / TAB CONTENT */}
          <div className={`lg:col-span-2`}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[9999] p-4"
          onClick={handleEmojiPickerClick}
          style={{ zIndex: 9999 }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full relative z-[10000]"
            style={{ zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Choose an emoji</h3>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
              {[
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
                '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
                '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
                '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
                '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
                '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
                '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
                '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
                '💘', '💝', '💟', '👍', '👎', '👌', '✌️', '🤞',
                '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️',
                '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐',
                '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
                '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷',
                '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '🎉',
                '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍭',
                '🍬', '🍫', '🍩', '🍪', '🍯', '🍞', '🥐', '🥖',
                '🥨', '🥯', '🧀', '🥚', '🍳', '🥞', '🧇', '🥓',
                '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕',
                '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜',
                '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚',
                '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦',
                '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',
                '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼',
                '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷',
                '🥃', '🍸', '🍹', '🧉', '🧊', '🥄', '🍴', '🍽️',
                '🥣', '🥡', '🥢', '🧂', '⚽', '🏀', '🏈', '⚾',
                '🥎', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸',
                '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁',
                '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷',
                '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️‍♂️',
                '🤼‍♀️', '🤼‍♂️', '🤸‍♀️', '🤸‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🤺', '🤾‍♀️',
                '🤾‍♂️', '🏌️‍♀️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘‍♂️', '🏄‍♀️', '🏄‍♂️',
                '🏊‍♀️', '🏊‍♂️', '🤽‍♀️', '🤽‍♂️', '🚣‍♀️', '🚣‍♂️', '🧗‍♀️', '🧗‍♂️',
                '🚵‍♀️', '🚵‍♂️', '🚴‍♀️', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉',
                '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹',
                '🤹‍♀️', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧',
                '🎼', '🎵', '🎶', '🪘', '🥁', '🎷', '🎺', '🎸',
                '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '♟️',
                '🃏', '🀄', '🎴', '🎯', '🎳', '🎮', '🕹️', '🎰'
              ].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {photoViewer.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[10001]"
          onClick={closePhotoViewer}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closePhotoViewer}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Arrows */}
            {photoViewer.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo */}
            <img
              src={photoViewer.photos[photoViewer.currentIndex]?.url}
              alt={`Photo ${photoViewer.currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Photo Counter */}
            {photoViewer.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                {photoViewer.currentIndex + 1} / {photoViewer.photos.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {photoViewer.photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto">
                {photoViewer.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-12 h-12 object-cover rounded cursor-pointer border-2 ${
                      index === photoViewer.currentIndex ? 'border-white' : 'border-transparent'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoViewer(prev => ({ ...prev, currentIndex: index }));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                onClick={closeCommentsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {commentsModal.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : commentsModal.comments.length > 0 ? (
                <div className="space-y-4">
                  {commentsModal.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      {/* Commenter Avatar */}
                      {comment.author?.profileImage ? (
                        <img 
                          src={comment.author.profileImage} 
                          alt={comment.author?.name || 'User'} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {(comment.author?.slug || comment.author?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Comment Content */}
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author?.slug ? `@${comment.author.slug}` : comment.author?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t">
              <div className="flex gap-3">
                {teacher?.personalInfo?.profileImage || teacher?.personalInfo?.profilePhoto ? (
                  <img 
                    src={teacher.personalInfo?.profileImage || teacher.personalInfo?.profilePhoto} 
                    alt={user?.name || 'User'} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4">
                  <input
                    type="text"
                    value={commentDrafts[commentsModal.postId] || ""}
                    onChange={(e) => onCommentChange(commentsModal.postId, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && commentDrafts[commentsModal.postId]?.trim()) {
                        submitComment(commentsModal.postId);
                      }
                    }}
                    placeholder="Write a comment..."
                    className="w-full py-2 bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => submitComment(commentsModal.postId)}
                    disabled={!commentDrafts[commentsModal.postId]?.trim()}
                    className={`ml-2 px-3 py-1 text-xs rounded-full transition-colors ${
                      commentDrafts[commentsModal.postId]?.trim() 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resume Modal */}
      <EditResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        teacherId={teacher?._id}
      />
    </div>
  );
};

export default TeacherProfile;