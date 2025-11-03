import React, { useState } from 'react'
import { Bell } from 'lucide-react'

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useState([
    {
      id: 1,
      title: 'New application received',
      message: 'Asha Rao applied for Mathematics Teacher position',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      title: 'Interview scheduled',
      message: 'Interview with Rajesh Kumar scheduled for tomorrow',
      time: '1 day ago',
      unread: true
    },
    {
      id: 3,
      title: 'Profile updated',
      message: 'Your school profile has been updated',
      time: '3 days ago',
      unread: false
    }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      notification.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`h-2 w-2 rounded-full mt-2 mr-3 ${
                        notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Mark all as read
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell








