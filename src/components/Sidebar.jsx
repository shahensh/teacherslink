import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Building, 
  Users, 
  Plus, 
  Search, 
  FileText, 
  User,
  CheckCircle,
  UserCheck,
  MessageCircle,
  BookOpen,
  Video,
  CreditCard,
  Briefcase
} from 'lucide-react'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import useUnreadBlogs from '../hooks/useUnreadBlogs'

const iconMap = {
  Home,
  Building,
  Users,
  Plus,
  Search,
  FileText,
  User,
  CheckCircle,
  UserCheck,
  MessageCircle,
  BookOpen,
  Video,
  CreditCard,
  Briefcase
}

const Sidebar = ({ items, user, logout }) => {
  const location = useLocation()
  const { unreadCount } = useUnreadMessages()
  const { unreadCount: unreadBlogCount } = useUnreadBlogs()
  
  console.log('Sidebar - unreadCount:', unreadCount, 'unreadBlogCount:', unreadBlogCount, 'user:', user?.id)

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:pb-0 lg:bg-white lg:border-r lg:border-gray-200">
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {items.map((item) => {
            const Icon = iconMap[item.icon]
            const isMessagesItem = item.name === 'Messages'
            const isBlogItem = item.name === 'Blog & Forum'
            
            // Get the appropriate unread count
            const itemUnreadCount = isMessagesItem ? unreadCount : (isBlogItem ? unreadBlogCount : 0)
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${
                  item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  {itemUnreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
                      {itemUnreadCount > 99 ? '99+' : itemUnreadCount}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar







