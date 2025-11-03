import React, { useState, useCallback, useMemo } from 'react';
import { X, Image } from 'lucide-react';
import { moderateContent, generateViolationMessage } from '../utils/contentModeration';
import { contentModerationApi } from '../api/contentModerationApi';
import ContentModerationModal from './ContentModerationModal';

const PostModal = React.memo(({ 
  isOpen, 
  onClose, 
  school, 
  teacher,
  onPost, 
  onMediaUpload, 
  onEmojiSelect, 
  showEmojiPicker, 
  onToggleEmojiPicker, 
  onEmojiPickerClick,
  imageOnly = false // New prop to restrict to images only
}) => {
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  // Reset states when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setNewPostCaption("");
      setNewPostMedia(null);
      setCompressionProgress(0);
      setIsCompressing(false);
      setModerationResult(null);
      setShowModerationModal(false);
      setIsModerating(false);
    }
  }, [isOpen]);

  // Memoized onChange handler for textarea
  const handleCaptionChange = useCallback((e) => {
    setNewPostCaption(e.target.value);
  }, []);

  // Memoized media upload handler
  const handleMediaUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostMedia(file);
      
      // Check if it's a video file and show compression progress
      if (file.type.startsWith('video/') && !imageOnly) {
        setIsCompressing(true);
        setCompressionProgress(0);
        
        // Simulate compression progress (actual compression happens on backend)
        const progressInterval = setInterval(() => {
          setCompressionProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setIsCompressing(false);
              return 100;
            }
            return prev + Math.random() * 15; // Random progress increments
          });
        }, 200);
      }
    }
  }, [imageOnly]);

  // Memoized media removal handler
  const handleRemoveMedia = useCallback(() => {
    setNewPostMedia(null);
  }, []);

  // Memoized post handler with content moderation
  const handlePost = useCallback(async () => {
    // Allow posts with just images (no caption required)
    if (!newPostCaption.trim() && !newPostMedia) {
      return;
    }

    // Content moderation (only if there's content to moderate)
    setIsModerating(true);
    try {
      // Only moderate if there's actual content
      if (newPostCaption.trim() || newPostMedia) {
        const moderationResponse = await contentModerationApi.moderatePost({
          caption: newPostCaption.trim() || '', // Send empty string if no caption
          mediaUrls: newPostMedia ? [URL.createObjectURL(newPostMedia)] : []
        });
        
        if (!moderationResponse.moderation.isAppropriate) {
          const violationMessage = generateViolationMessage(moderationResponse.moderation.violations);
          setModerationResult(violationMessage);
          setShowModerationModal(true);
          setIsModerating(false);
          return;
        }
      }
      
      // Content is appropriate, proceed with posting
      onPost({
        caption: newPostCaption,
        media: newPostMedia ? [newPostMedia] : []
      });
      
      // Reset states
      setNewPostCaption("");
      setNewPostMedia(null);
    } catch (error) {
      console.error('Content moderation failed:', error);
      // If moderation fails, allow posting but log the error
      onPost({
        caption: newPostCaption,
        media: newPostMedia ? [newPostMedia] : []
      });
      
      // Reset states
      setNewPostCaption("");
      setNewPostMedia(null);
    } finally {
      setIsModerating(false);
    }
  }, [newPostCaption, newPostMedia, onPost]);

  // Memoized close handler
  const handleClose = useCallback(() => {
    setNewPostCaption("");
    setNewPostMedia(null);
    onClose();
  }, [onClose]);

  // Memoized button state
  const buttonState = useMemo(() => {
    const hasContent = newPostCaption.trim() || newPostMedia;
    const isDisabled = !hasContent || isModerating;
    return {
      disabled: isDisabled,
      className: `w-full py-2 rounded-lg text-white font-bold flex items-center justify-center gap-2 ${
        isDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`
    };
  }, [newPostCaption, newPostMedia, isModerating]);

  // Moderation modal handlers
  const handleModerationApprove = useCallback(() => {
    setShowModerationModal(false);
    // Proceed with posting despite warnings
    onPost({
      caption: newPostCaption,
      media: newPostMedia ? [newPostMedia] : []
    });
    setNewPostCaption("");
    setNewPostMedia(null);
  }, [newPostCaption, newPostMedia, onPost]);

  const handleModerationReject = useCallback(() => {
    setShowModerationModal(false);
    setModerationResult(null);
  }, []);

  // Memoized textarea keydown handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handlePost();
    }
  }, [handlePost]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* MODAL HEADER */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Create post</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROFILE INFO & PRIVACY */}
        <div className="flex items-center gap-3 p-4 pb-2">
          <img 
            src={
              school?.profileImage || 
              teacher?.personalInfo?.profileImage || 
              teacher?.personalInfo?.profilePhoto
            } 
            alt={school ? "school" : "teacher"} 
            className="w-10 h-10 rounded-full object-cover" 
          />
          <div>
            <div className="font-semibold text-sm">
              {school?.schoolName || teacher?.fullName || 'Loading...'}
            </div>
            <div className="text-xs text-blue-600 border border-gray-300 rounded-md px-2 py-0.5 mt-1 inline-flex items-center gap-1 cursor-pointer">
              <span className="font-medium">Public</span>
            </div>
          </div>
        </div>

        {/* TEXT AREA */}
        <div className="px-4">
          <textarea
            key="post-caption-textarea"
            rows={5}
            value={newPostCaption}
            onChange={handleCaptionChange}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            className="w-full p-2 resize-none focus:ring-0 focus:border-0 border-none text-xl font-normal leading-normal"
            autoFocus
          />
        </div>

        {/* MEDIA PREVIEW */}
        {newPostMedia && (
          <div className="px-4 mt-3 relative">
            {newPostMedia instanceof File && (
              <img
                src={URL.createObjectURL(newPostMedia)}
                alt="Preview"
                className="w-full h-40 object-cover rounded-md border"
              />
            )}
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-6 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* COMPRESSION PROGRESS */}
        {isCompressing && (
          <div className="px-4 mt-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Compressing video...</span>
                <span className="text-sm text-blue-600">{compressionProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                This may take a moment for large videos. Compression reduces file size for faster uploads.
              </p>
            </div>
          </div>
        )}

        {/* ADD TO YOUR POST BAR */}
        <div className="p-4 border-y mt-2 flex justify-between items-center">
          <span className="text-gray-600 font-medium text-sm">Add to your post</span>
          <div className="flex items-center gap-4">
            {/* Photo/Video Input */}
            <label className="text-green-500 cursor-pointer" title={imageOnly ? "Add photo" : "Add photo or video"}>
              <Image className="w-6 h-6" />
              <input
                type="file"
                accept={imageOnly ? "image/*" : "image/*,video/*"}
                onChange={handleMediaUpload}
                className="hidden"
              />
            </label>

            {/* Emoji Picker Button */}
            {/* <button
              onClick={onToggleEmojiPicker}
              className="text-blue-500 cursor-pointer hover:text-blue-600 transition-colors"
              type="button"
            >
              🙂
            </button> */}
          </div>
        </div>

        {/* POST BUTTON */}
        <div className="p-4 pt-2">
          <button
            onClick={handlePost}
            disabled={buttonState.disabled}
            className={buttonState.className}
          >
            {isModerating ? 'Checking content...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[9999] p-4"
          onClick={onEmojiPickerClick}
          style={{ zIndex: 9999 }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full relative z-[10000]"
            style={{ zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Choose an emoji</h3>
              <button
                onClick={onToggleEmojiPicker}
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
                  onClick={() => {
                    onEmojiSelect(emoji);
                    setNewPostCaption(prev => prev + emoji);
                  }}
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

      {/* Content Moderation Modal */}
      <ContentModerationModal
        isOpen={showModerationModal}
        onClose={handleModerationReject}
        violations={moderationResult?.violations || []}
        onApprove={moderationResult?.type === 'warning' ? handleModerationApprove : null}
        onReject={handleModerationReject}
        type={moderationResult?.type || 'error'}
      />
    </div>
  );
});

PostModal.displayName = 'PostModal';

export default PostModal;
