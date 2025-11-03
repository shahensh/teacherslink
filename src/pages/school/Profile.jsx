import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { schoolApi } from "../../api/schoolApi";
import * as postApi from "../../api/postApi";
import { useSocialSocket } from "../../hooks/useSocialSocket";
import SchoolRating from "../../components/SchoolRating";
import PostModal from "../../components/PostModal";
import PostMenu from "../../components/PostMenu";

import { toast } from "react-hot-toast";

import {

  Camera,

  MapPin,

  Phone,

  Mail,

  Globe,

  ShieldCheck,

  Edit3,

  Save,

  X,


  MessageSquare,

  Share2,

  MoreHorizontal,

  Image, // Used for Photo/video icon

  Send, // Used for Post button in modal

  Video, // Used for Live Video

  Calendar, // Used for Life Event

  ArrowLeft, // Back arrow icon

} from "lucide-react";



/**

 * Facebook-like School Profile (production-ready)

 */



const Profile = () => {

  const { user } = useAuth();
  const { socket, isConnected, joinPostRoom, leavePostRoom } = useSocialSocket();
  const { id } = useParams(); // Get the profile ID from URL
  const navigate = useNavigate();



  const [school, setSchool] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({});
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("posts");

  const [posts, setPosts] = useState([]);

  const [commentDrafts, setCommentDrafts] = useState({}); // { postId: 'text' }

  // Comments modal state
  const [commentsModal, setCommentsModal] = useState({
    isOpen: false,
    postId: null,
    comments: [],
    loading: false
  });

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Photo viewer state
  const [photoViewer, setPhotoViewer] = useState({
    isOpen: false,
    photos: [],
    currentIndex: 0
  });

  // Check if the current user is the owner of this profile
  const { id: routeSchoolId } = useParams();
  const isOwner = useMemo(() => {
    // Require a logged-in user and loaded school
    if (!user || !school) {
      return false;
    }

    const userId = user._id || user.id;
    const schoolUserId = school.user;

    // Case 1: Own profile route (/school/profile has no :id)
    if (!routeSchoolId && user.role === 'school') {
      return true;
    }

    // Case 2: Strict match via owner id
    if (userId && schoolUserId && userId.toString() === schoolUserId.toString()) {
      return true;
    }

    // Case 3: Fallback - if route id equals current school id and user is school
    if (routeSchoolId && school._id && routeSchoolId.toString() === school._id.toString() && user.role === 'school') {
      return true;
    }

    return false;
  }, [user, school, routeSchoolId]);

 

  // === NEW POST STATES ===

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // =======================



  useEffect(() => {

    // If viewing another school's profile (id exists), allow any authenticated user
    // If viewing own profile, only allow school users
    if (user && (id || user.role === 'school')) {

    fetchSchoolProfile();

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [user, id]);

  // Real-time event listeners

  useEffect(() => {

    if (!socket || !isConnected) return;

    // Listen for new posts

    const handleNewPost = (event) => {

      const data = event.detail;

      if (data.data && data.data.authorProfile === school?._id) {

        setPosts(prev => [data.data, ...prev]);

      }

    };



    // Listen for post comments

    const handlePostCommented = (event) => {

      const data = event.detail;

      setPosts(prev =>

        prev.map(post =>

          post._id === data.postId

            ? {

                ...post,

                commentsCount: (post.commentsCount || 0) + 1

              }

            : post

        )

      );

    };

    // Listen for image uploads

    const handleImageUploaded = (event) => {

      const data = event.detail;

      if (data.userId === user?._id) {

        if (data.imageType === 'profile') {

          setSchool(prev => ({ ...prev, profileImage: data.url }));

        } else if (data.imageType === 'cover') {

          setSchool(prev => ({ ...prev, coverImage: data.url }));

        }

      }

    };

    // Register event listeners

    window.addEventListener('newPost', handleNewPost);


    window.addEventListener('postCommented', handlePostCommented);

    window.addEventListener('imageUploaded', handleImageUploaded);

    // Cleanup

    return () => {

      window.removeEventListener('newPost', handleNewPost);


      window.removeEventListener('postCommented', handlePostCommented);

      window.removeEventListener('imageUploaded', handleImageUploaded);

    };

  }, [socket, isConnected, school?._id, user?._id]);

  // Add keyboard event listener for photo viewer
  useEffect(() => {
    if (photoViewer.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [photoViewer.isOpen]);



  const fetchSchoolProfile = async () => {

    try {

      // Removed debug logs to prevent re-render issues

      // If id parameter exists, fetch that specific school's profile
      // Otherwise, fetch the current user's own profile
      const response = id ? await schoolApi.getProfileById(id) : await schoolApi.getProfile();

      // Removed debug log

      if (response.success) {

        const fetchedSchool = response.school;

        console.log('📸 School profile data:', {
          schoolName: fetchedSchool.schoolName,
          profileImage: fetchedSchool.profileImage,
          coverImage: fetchedSchool.coverImage,
          hasProfileImage: !!fetchedSchool.profileImage,
          hasCoverImage: !!fetchedSchool.coverImage
        });

      setSchool(fetchedSchool);

      setFormData(fetchedSchool);

        

        // Fetch posts for this school profile

        const postsResponse = await postApi.getProfilePosts(fetchedSchool._id);

        // Removed debug log

        if (postsResponse.success) {

          // Removed debug logs

          setPosts(postsResponse.posts || []);

        }

      }

    } catch (error) {

      console.error("Error fetching school profile:", error);
      console.error("Error details:", error.response?.data);

      // Set error state
      setError(error.response?.data?.message || "Failed to load school profile");

      // Show more specific error message
      if (error.response?.status === 404) {
        toast.error("School profile not found");
      } else if (error.response?.status === 403) {
        toast.error("Access denied");
      } else {
      toast.error("Failed to load school profile");
      }

      } finally {

      setLoading(false);

    }

  };



  const handleInputChange = (e) => {

    const { name, value } = e.target;

    // Handle nested object properties (e.g., contactInfo.phone, address.city)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
    setFormData((prev) => ({
      ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
      [name]: value,
      }));
    }

    // Check username availability when slug field changes
    if (name === 'slug' && value) {
      checkUsernameAvailability(value);
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
      const response = await schoolApi.checkUsername(username);
      setUsernameAvailability(response);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailability({ available: false, message: 'Error checking username' });
    } finally {
      setCheckingUsername(false);
    }
  };



  const handleSave = async () => {

    setSaving(true);

    try {

      const response = await schoolApi.updateProfile(formData);

      if (response.success) {

        setSchool(response.school);

      setEditing(false);

        toast.success("Profile updated successfully");

      }

    } catch (error) {

      console.error("Error updating profile:", error);

      toast.error("Failed to update profile");

    } finally {

      setSaving(false);

    }

  };



  const handleCancel = () => {

    setFormData(school);

    setEditing(false);

  };



  // --- Post interactions (real API calls) ---




  const submitComment = async (postId) => {

    const text = commentDrafts[postId]?.trim();

    if (!text) return;

    try {

      const response = await postApi.addComment(postId, text);

      if (response.success) {

    setPosts((prev) =>

      prev.map((p) =>

        p._id === postId

          ? {

              ...p,

              commentsCount: (p.commentsCount || 0) + 1,

            }

          : p

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

      console.error("Error adding comment:", error);

      toast.error("Failed to add comment");

    }

  };



  const onCommentChange = (postId, value) => {

    setCommentDrafts((s) => ({ ...s, [postId]: value }));

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



  // --- New Post Logic ---

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
        // Add the new post to the beginning of the posts array
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

  // Handle profile image upload

  const handleProfileImageUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      const formData = new FormData();

      formData.append('profileImage', file);

      const response = await schoolApi.uploadProfileImage(formData);

      console.log('📸 Profile image upload response:', response);

      if (response.success) {

        console.log('✅ Updating school state with profileImage:', response.profileImage);
        setSchool(prev => ({ ...prev, profileImage: response.profileImage }));

        toast.success("Profile image updated successfully");

      }

    } catch (error) {

      console.error("Error uploading profile image:", error);

      toast.error("Failed to upload profile image");

    }

  };

  // Handle cover image upload

  const handleCoverImageUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      const formData = new FormData();

      formData.append('coverImage', file);

      const response = await schoolApi.uploadCoverImage(formData);

      console.log('📸 Cover image upload response:', response);

      if (response.success) {

        console.log('✅ Updating school state with coverImage:', response.coverImage);
        setSchool(prev => ({ ...prev, coverImage: response.coverImage }));

        toast.success("Cover image updated successfully");

      }

    } catch (error) {

      console.error("Error uploading cover image:", error);

      toast.error("Failed to upload cover image");

    }

  };

  // Handle share post functionality

  const handleSharePost = async (post) => {

    try {

      const response = await postApi.sharePost(post._id);

      if (response.success) {

        // Update the post's share count

        setPosts(prev =>

          prev.map(p =>

            p._id === post._id

              ? {

                  ...p,

                  sharesCount: (p.sharesCount || 0) + 1

                }

              : p

          )

        );

        toast.success("Post shared successfully!");

      }

    } catch (error) {

      console.error("Error sharing post:", error);

      toast.error("Failed to share post");

    }

  };

  // Handle native share functionality

  const handleNativeShare = async (post) => {

    const shareData = {

      title: `${school?.schoolName || 'School'} - Post`,

      text: post.caption || 'Check out this post!',

      url: `${window.location.origin}/post/${post._id}`

    };

    try {

      if (navigator.share) {

        await navigator.share(shareData);

        // Also update share count

        await handleSharePost(post);

      } else {

        // Fallback: copy to clipboard

        await navigator.clipboard.writeText(shareData.url);

        toast.success("Post link copied to clipboard!");

        // Also update share count

        await handleSharePost(post);

      }

    } catch (error) {

      console.error("Error sharing:", error);

      // Fallback: copy to clipboard

      try {

        await navigator.clipboard.writeText(shareData.url);

        toast.success("Post link copied to clipboard!");

        await handleSharePost(post);

      } catch (clipboardError) {

        toast.error("Failed to share post");

      }

    }

  };



  // --- Utility functions ---

  const formatDateTime = (dateStr) => {

    if (!dateStr) return "";

    const d = new Date(dateStr);

    // return d.toLocaleString(); // Use relative time for Facebook look

    const now = new Date();

    const diffInDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";

    if (diffInDays === 1) return "Yesterday";

    if (diffInDays < 7) return `${diffInDays} days ago`;

    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  };



  const formatJoinedDate = (dateStr) => {

    if (!dateStr) return "";

    const d = new Date(dateStr);

    return `Joined on ${d.toLocaleString(undefined, { month: "long", year: "numeric", day: "numeric" })}`;

  };

 

  // PostModal is now imported as a separate component





  // --- Tab Content Components ---



  const renderPostsContent = () => {

    if (posts.length === 0) {

      return <div className="text-center text-gray-500 py-10">No posts yet</div>;

    }

   

    // ... (rest of the post rendering logic)

    return posts.map((post) => (

        <article key={post._id} className="bg-white rounded-md shadow-sm border border-gray-100 mb-4">

        {/* Post header (Simplified to match the provided image styles) */}

        <div className="flex items-start gap-3 px-4 py-3">

            <img src={school.profileImage} alt="school" className="w-11 h-11 rounded-full object-cover" />

            <div className="flex-1">

            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900">{school?.schoolName || 'Loading...'}</div>
                    <span className="inline-flex items-center text-xs font-medium text-gray-500">
                        School
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



            {/* caption */}

            {post.caption && <p className="mt-3 text-gray-800 whitespace-pre-wrap">{post.caption}</p>}



            {/* media */}

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



            {/* actions (Like, Comment, Share) */}

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



            {/* comment input (Matching WhatsApp Image 2025-10-12 at 11.07.51) */}

            <div className="mt-3 border-t pt-2">

                <div className="flex items-start gap-3">

                <img src={school.profileImage} alt="mini" className="w-8 h-8 rounded-full object-cover" />

                <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4">

                    <input

                        id={`comment-${post._id}`}

                        type="text"

                        value={commentDrafts[post._id] || ""}

                        onChange={(e) => onCommentChange(post._id, e.target.value)}

                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && commentDrafts[post._id]?.trim()) {
                            e.preventDefault();
                            submitComment(post._id);
                          }
                        }}

                        placeholder="Write a comment..."

                        className="w-full py-2 bg-transparent text-sm focus:outline-none"

                    />

                    {/* Comment action buttons */}

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

                {/* Immediate comments preview */}

                {post.comments && post.comments.length > 0 && (

                    <div className="mt-3 space-y-2 text-xs text-gray-500">

                        View {post.comments.length} comments...

              </div>

                )}

            </div>

              </div>

              </div>

        </article>

    ));

  };





  const renderContent = () => {

    // Debug logging removed to prevent re-render issues



    switch (activeTab) {

      case "posts":

      default:

        return (

            <>

                {/* *** VISIBLE CREATE POST CARD (Matching WhatsApp Image 2025-10-12 at 11.07.51) *** */}

                {/* Temporary: Always show for school users for debugging */}
                {(isOwner || (user && user.role === "school")) && (

                    <div className="bg-white rounded-md p-4 mb-4 border border-gray-100 shadow-sm">

                        {/* Top Row: Profile Image & "What's on your mind?" Input-like button */}

                        <div className="flex items-center gap-3 border-b pb-3">

                            <img src={school.profileImage} alt="me" className="w-10 h-10 rounded-full object-cover" />

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

                           

                            {/* Photo/Video (Matches the requested style) */}

                            <button onClick={() => setIsPostModalOpen(true)} className="flex items-center justify-center flex-1 gap-1 text-green-600 hover:bg-gray-50 p-2 rounded-md transition-colors text-sm">

                                <Image className="w-4 h-4" />

                                <span className="font-medium">Photo/video</span>

                            </button>



                            {/* Life Event */}
                          {/* <button onClick={() => setIsPostModalOpen(true)} className="flex items-center justify-center flex-1 gap-1 text-blue-600 hover:bg-gray-50 p-2 rounded-md transition-colors text-sm">

                                <Calendar className="w-4 h-4" />

                                <span className="hidden sm:inline">Life event</span>

              </button> */}

            </div>

          </div>

                )}

               

                {/* Posts Feed */}

                {renderPostsContent()}

            </>

        );

      // Other cases (renderAboutContent, etc.) are omitted for brevity but remain in place

      case "about":

        return renderAboutContent();

      case "media":

        return renderMediaContent();

      case "reviews":

        return renderReviewsContent();

    }

  };



  // ... (renderAboutContent, renderMediaContent, renderReviewsContent functions defined outside renderContent)

  // Re-define them here (or use the original definitions, which are lengthy):



  const renderAboutContent = () => (

    <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm">

      <h2 className="text-xl font-bold mb-4">About {school?.schoolName || 'Loading...'}</h2>

      <p className="text-gray-700 mb-6 whitespace-pre-wrap">{school.description || "The school has not provided a detailed description yet."}</p>



      <h3 className="text-lg font-semibold mb-3 border-b pb-1">Contact Information</h3>

      <div className="text-sm text-gray-600 space-y-3">

        <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-600"/> <strong>Address:</strong> {school.address?.street || "Street"}, {school.address?.city || "City"}, {school.address?.state || "State"}, {school.address?.zip || "Zip"}</div>

        <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-blue-600"/> <strong>Phone:</strong> {school.contactInfo?.phone || "N/A"}</div>

        <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-600"/> <strong>Email:</strong> <a href={`mailto:${school?.user?.email || school.contactInfo?.email}`} className="text-blue-600 hover:underline">{school?.user?.email || school.contactInfo?.email || "N/A"}</a></div>

        <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-blue-600"/> <strong>Website:</strong> <a href={school.contactInfo?.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{school.contactInfo?.website || "N/A"}</a></div>

      </div>

      <div className="mt-6 text-sm text-gray-500 border-t pt-3">

          <p>{formatJoinedDate(school.createdAt)}</p>

      </div>

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

    return (
      <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Photos & Videos</h2>

        {allMedia.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allMedia.map((media, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                {media.type === 'video' ? (
                  <video
                    src={media.url}
                    alt={`Video ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`Media ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
                )}
              </div>
        ))}
                </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg font-medium mb-2">No media yet</p>
            <p className="text-sm">Photos and videos from your posts will appear here</p>
                </div>
        )}
      </div>
    );
  };



  const renderReviewsContent = () => {
    // Get reviews from school data
    const reviews = school?.reviews || [];
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    return (
    <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Teacher & Parent Reviews</h2>

        {reviews.length > 0 ? (
          <>
      <div className="flex items-center mb-6 border-b pb-4">
              <div className="text-5xl font-extrabold text-yellow-500">{averageRating}</div>
          <div className="ml-4">
                <div className="text-yellow-500">
                  {'★'.repeat(Math.floor(averageRating))}
                  {'☆'.repeat(5 - Math.floor(averageRating))}
              </div>
                <p className="text-sm text-gray-500">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
        </div>

            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {review.teacher?.personalInfo?.firstName?.charAt(0) || 'T'}
    </div>
                      <div>
                        <p className="font-medium text-sm">
                          {review.teacher?.personalInfo?.firstName} {review.teacher?.personalInfo?.lastName}
                        </p>
                        <div className="text-yellow-500 text-xs">
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-lg font-medium mb-2">No reviews yet</p>
            <p className="text-sm">Reviews from teachers and parents will appear here</p>
          </div>
        )}
      </div>
    );
  };

 

  // --- Loading/Error states ---

  if (loading)

    return (

      <div className="flex justify-center items-center h-96">

        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>

      </div>

    );



  if (!school)

    return (

      <div className="text-center py-16">

        <p className="text-gray-500">No school profile found.</p>

      </div>

    );



  return (

    <div className="bg-gray-50 min-h-screen pb-12">

       

      {/* Post Modal */}
      <PostModal
          isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        school={school}
        onPost={handleNewPost}
        onEmojiSelect={handleEmojiSelect}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={toggleEmojiPicker}
        onEmojiPickerClick={handleEmojiPickerClick}
      />



      {/* COVER */}

      <div className="relative w-full h-80 bg-gray-200">

        <img

          src={school.coverImage || '/default-cover.jpg'}

          alt="Cover"

          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/default-cover.jpg';
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

      <div className="relative max-w-5xl mx-auto">

        <div className="absolute -top-24 left-1/2 transform -translate-x-1/2">

          <div className="relative">

            <img

              src={school.profileImage || '/default-avatar.png'}

              alt="Profile"

              className="w-44 h-44 rounded-full border-4 border-white shadow-lg object-cover"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}

            />

            {editing && (

              <label className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 cursor-pointer">

                <Camera className="h-4 w-4" />

                <input

                  type="file"

                  accept="image/*"

                  onChange={handleProfileImageUpload}

                  className="hidden"

                />

              </label>

            )}

          </div>

        </div>



        <div className="pt-28 text-center">

          <h1 className="text-3xl font-bold text-gray-900">{school?.schoolName || 'Loading...'}</h1>

          {/* School Tag */}
          <div className="flex items-center justify-center mt-2 mb-3">
            <span className="inline-flex items-center text-xs font-medium text-gray-600">
              School | Institution
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">

            {/* Premium Verification Badge */}
            {school?.plan?.isPremium && school?.plan?.expiresAt && new Date(school.plan.expiresAt) > new Date() && (

              <span className="flex items-center gap-1 text-blue-600 text-sm">

                <ShieldCheck className="w-4 h-4" /> Verified Premium

              </span>

            )}

            <span className="text-gray-600 text-sm">@{school?.slug || 'loading'}</span>

          </div>



          {/* Meta: connections & joined */}

          <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-700">

            {/* <div className="flex items-center gap-2">

              <span className="font-semibold text-gray-900">{school.connections || 0}</span>

              <span className="text-gray-600">connections</span>

            </div> */}



            <div className="flex items-center gap-2">

              <MapPin className="w-4 h-4 text-gray-500" />

              <span className="text-gray-700">

                {school.address?.city ? `${school.address.city}, ${school.address?.state || ""}` : "Location not set"}

              </span>

            </div>



            <div className="text-gray-600">

              {formatJoinedDate(school.createdAt)}

            </div>

          </div>



          {/* Email display - Real-time from login */}

          <div className="flex items-center justify-center mt-2">

            <div className="flex items-center gap-2 text-sm text-gray-600">

              <Mail className="w-4 h-4 text-gray-500" />

              <span>{school?.user?.email || school?.contactInfo?.email || 'Loading...'}</span>

            </div>

          </div>



          {/* Edit Form Fields */}
          {editing && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Edit Profile Information</h3>
              
              <div className="space-y-4">
                {/* School Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter school name"
                  />
                </div>

                {/* Username/Slug */}
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
                  
                  {/* Username availability indicator */}
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter school description"
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
                      name="contactInfo.phone"
                      value={formData.contactInfo?.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="contactInfo.website"
                      value={formData.contactInfo?.website || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address?.city || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address?.state || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter state"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isOwner ? (
            // School's own profile - show edit buttons
            <div className="flex justify-center mt-4 gap-3">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border rounded-md text-gray-700 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
                  >
                    {saving ? (
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </button>
              )}
            </div>
          ) : user?.role === 'teacher' ? (
            // Teacher viewing school profile - show message button
            <div className="flex justify-center mt-4 gap-3">
              <button
                onClick={async () => {
                  // Check if school data is loaded
                  if (!school || !school.schoolName) {
                    toast.error('School data not loaded yet. Please try again.');
                    return;
                  }

                  try {
                    // Try to find an existing application with this school
                    const { applicationsApi } = await import('../../api/applicationsApi');
                    const applicationsResponse = await applicationsApi.getApplications();
                    
                    // Extract applications array from response
                    const applications = applicationsResponse.data || applicationsResponse.applications || applicationsResponse || [];
                    
                    // Removed debug logs
                    
                    // Find application for this school
                    const schoolApplication = applications.find(app => {
                      const appSchoolId = app.school?._id || app.school;
                      // Removed debug log
                      return appSchoolId === school._id || appSchoolId === school._id.toString();
                    });
                    
                    if (schoolApplication) {
                      // Removed debug log
                      // Navigate to chat with specific application
                      navigate('/teacher/chat', {
                        state: {
                          applicationId: schoolApplication._id,
                          schoolId: school._id,
                          schoolName: school.schoolName,
                          jobTitle: schoolApplication.job?.title || 'General Inquiry'
                        }
                      });
                      toast.success(`Opening existing conversation with ${school.schoolName}`);
                    } else {
                      // Removed debug logs
                      navigate('/teacher/chat', {
                        state: {
                          schoolId: school._id,
                          schoolName: school.schoolName,
                          createNewConversation: true,
                          message: `Hi! I'm interested in learning more about job opportunities at ${school.schoolName}.`
                        }
                      });
                      toast.success(`Starting new conversation with ${school.schoolName}`);
                    }
                  } catch (error) {
                    console.error('Error finding conversation:', error);
                    // Fallback to general chat with school info
                    navigate('/teacher/chat', {
                      state: {
                        schoolId: school._id,
                        schoolName: school.schoolName,
                        createNewConversation: true
                      }
                    });
                    toast.info(`Starting conversation with ${school.schoolName}`);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Message School
              </button>
          </div>
          ) : null}

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
            
            {/* School Rating Section */}
            <div className="mb-6">
              <SchoolRating schoolId={school?._id} schoolName={school?.schoolName} />
            </div>

            <div className="sticky top-28 space-y-4">

              <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">

                <h3 className="text-sm font-bold mb-2">About</h3>

                <p className="text-sm text-gray-700 mb-2">{school.description || "No description provided."}</p>

                <div className="text-sm text-gray-600 space-y-2">

                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {school.address?.city || "City"}</div>

                  <div className="flex items-center gap-2"><Phone className="w-4 h-4"/> {school.contactInfo?.phone || "Phone"}</div>

                  <div className="flex items-center gap-2"><Mail className="w-4 h-4"/> {school?.user?.email || school.contactInfo?.email || "Email"}</div>

                  <div className="flex items-center gap-2"><Globe className="w-4 h-4"/> {school.contactInfo?.website || "Website"}</div>

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
                {school?.profileImage ? (
                  <img 
                    src={school.profileImage} 
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentDrafts[commentsModal.postId]?.trim()) {
                        e.preventDefault();
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

    </div>

  );
};

export default Profile

