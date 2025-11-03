import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, Trash2, Eye, ChevronDown, ChevronUp, Filter, Search, Calendar, Clock, User, Building, FileText, MessageSquare } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import NotificationModal from './NotificationModal';
import toast from 'react-hot-toast';

const NotificationDropdown = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Full notification list modal state
  const [isFullListOpen, setIsFullListOpen] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [fullListLoading, setFullListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load notifications and unread count
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationApi.getNotifications(1, 10),
        notificationApi.getUnreadCount()
      ]);

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications);
      }
      if (unreadResponse.success) {
        setUnreadCount(unreadResponse.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all notifications for full list
  const loadAllNotifications = useCallback(async (page = 1, reset = false) => {
    try {
      setFullListLoading(true);
      const response = await notificationApi.getNotifications(page, 20);
      
      if (response.success) {
        const newNotifications = response.data.notifications;
        if (reset) {
          setAllNotifications(newNotifications);
        } else {
          setAllNotifications(prev => [...prev, ...newNotifications]);
        }
        
        // Check if there are more notifications
        setHasMore(newNotifications.length === 20);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading all notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setFullListLoading(false);
    }
  }, []);

  // Load more notifications (pagination)
  const loadMoreNotifications = useCallback(() => {
    if (!fullListLoading && hasMore) {
      loadAllNotifications(currentPage + 1, false);
    }
  }, [loadAllNotifications, currentPage, hasMore, fullListLoading]);

  // Open full notification list
  const handleViewAllNotifications = () => {
    setIsFullListOpen(true);
    setIsOpen(false); // Close dropdown
    loadAllNotifications(1, true); // Load first page
  };

  // Close full notification list
  const handleCloseFullList = () => {
    setIsFullListOpen(false);
    setSearchTerm('');
    setFilterType('all');
    setShowFilters(false);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Socket.IO real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (data) => {
        console.log('New notification received:', data);
        
        // Add new notification to the list
        setNotifications(prev => [data.notification, ...prev.slice(0, 9)]);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success(data.notification.title, {
          duration: 5000,
          icon: '🔔'
        });
      };

      // Handle new chat messages
      const handleNewMessage = (data) => {
        console.log('New chat message notification:', data);
        
        // Create a notification for the new message
        const messageNotification = {
          _id: `msg_${data.message._id}`,
          type: 'message',
          title: 'New Message',
          message: `You have a new message: "${data.message.message.substring(0, 50)}${data.message.message.length > 50 ? '...' : ''}"`,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: {
            applicationId: data.applicationId,
            senderId: data.senderId,
            messageId: data.message._id
          }
        };
        
        // Add to notifications list
        setNotifications(prev => [messageNotification, ...prev.slice(0, 9)]);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success('New message received!', {
          duration: 3000,
        });
      };

      socket.on('new_notification', handleNewNotification);
      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_notification', handleNewNotification);
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Handle notification click to open full view
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    
    // Open modal
    setSelectedNotification(notification);
    setIsModalOpen(true);
    setIsOpen(false); // Close dropdown
    setIsFullListOpen(false); // Close full list modal
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  // Filter notifications based on search and filter criteria
  const filteredNotifications = allNotifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.data?.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.data?.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || notification.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'shortlist':
        return '🎉';
      case 'reject':
        return '📄';
      case 'interview':
        return '📅';
      case 'job_posted':
        return '💼';
      case 'application_received':
        return '📨';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Format full date
  const formatFullDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-blue-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-blue-700 dark:border-gray-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see updates about your applications here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notification.message}
                      </p>
                      {notification.data?.schoolName && (
                        <p className="text-xs text-gray-500 mt-1">
                          From: {notification.data.schoolName}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button 
                onClick={handleViewAllNotifications}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Full Notification List Modal */}
      {isFullListOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col relative z-40">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">All Notifications</h2>
                  <p className="text-sm text-gray-500">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseFullList}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="shortlist">Shortlisted</option>
                        <option value="reject">Rejected</option>
                        <option value="interview">Interview</option>
                        <option value="job_posted">Job Posted</option>
                        <option value="application_received">Application Received</option>
                        <option value="message">Message</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {fullListLoading && allNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No notifications found</p>
                  <p className="text-sm">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'You\'ll see updates about your applications here.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {notification.data?.schoolName && (
                                <div className="flex items-center space-x-1">
                                  <Building className="w-3 h-3" />
                                  <span>{notification.data.schoolName}</span>
                                </div>
                              )}
                              {notification.data?.jobTitle && (
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{notification.data.jobTitle}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatFullDate(notification.createdAt)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification._id)}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Mark as read"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notification._id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && !fullListLoading && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMoreNotifications}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Load More Notifications
                  </button>
                </div>
              )}

              {fullListLoading && allNotifications.length > 0 && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading more notifications...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredNotifications.length} of {allNotifications.length} notifications
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
