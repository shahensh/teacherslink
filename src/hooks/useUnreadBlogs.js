import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { blogApi } from '../api/blogApi';

const useUnreadBlogs = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unread blog count
  const fetchUnreadCount = useCallback(async () => {
    if (!user || user.role === 'admin') {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    console.log('Fetching unread blog count for user:', user.id);
    try {
      const response = await blogApi.getUnreadBlogCount();
      console.log('Unread blog count response:', response);
      if (response.success) {
        setUnreadCount(response.count);
        console.log('Unread count set to:', response.count);
      }
    } catch (error) {
      console.error('Error fetching unread blog count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mark blogs as read
  const markAsRead = useCallback(async (blogIds) => {
    if (!user || user.role === 'admin' || !blogIds || blogIds.length === 0) return;

    try {
      await blogApi.markBlogsAsRead(blogIds);
      // Update local count
      setUnreadCount(prev => Math.max(0, prev - blogIds.length));
    } catch (error) {
      console.error('Error marking blogs as read:', error);
    }
  }, [user]);

  // Mark all blogs as read
  const markAllAsRead = useCallback(async () => {
    if (!user || user.role === 'admin') return;

    console.log('Marking all blogs as read for user:', user.id);
    try {
      const response = await blogApi.markAllBlogsAsRead();
      console.log('Mark all blogs as read response:', response);
      setUnreadCount(0);
      console.log('Unread count set to 0');
    } catch (error) {
      console.error('Error marking all blogs as read:', error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Socket.IO for real-time updates
  useEffect(() => {
    if (socket && user && user.role !== 'admin') {
      // Listen for new blog posts
      socket.on('new_blog_published', (blog) => {
        console.log('New blog published:', blog);
        setUnreadCount(prev => prev + 1);
      });

      // Listen for blog updates
      socket.on('blog_updated', (updatedBlog) => {
        // If blog was unpublished, decrease count
        if (updatedBlog.status === 'draft') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });

      // Listen for blog deletions
      socket.on('blog_deleted', (blogId) => {
        setUnreadCount(prev => Math.max(0, prev - 1));
      });

      return () => {
        socket.off('new_blog_published');
        socket.off('blog_updated');
        socket.off('blog_deleted');
      };
    }
  }, [socket, user]);

  return {
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshCount: fetchUnreadCount
  };
};

export default useUnreadBlogs;

