import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../context/SocketContext'
import { useLanguage } from '../context/LanguageContext'
import SearchBar from './SearchBar'
import NotificationDropdown from './NotificationDropdown'
import { 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Home, 
  Building, 
  Users, 
  Plus, 
  FileText, 
  CheckCircle,
  UserCheck,
  MessageCircle,
  BookOpen,
  Video,
  CreditCard,
  Globe,
  Briefcase
} from 'lucide-react'

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

const Navbar = ({ user, logout, sidebarItems = [] }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { socket } = useSocket()
  const { language, toggleLanguage, t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsProfileOpen(false)
  }
  

  return (
    // NOTE: Facebook's navbar is usually a deep blue color.
    // We are changing the background to blue-700 and making the icons/text white for the classic look.
    <nav className="bg-blue-700 shadow-lg border-b border-blue-800 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* LEFT SECTION: Logo/Menu Button */}
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink-0">
            
            {/* Mobile Menu Toggle (White icon against blue background) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-md text-white hover:bg-blue-800 dark:text-gray-300 dark:hover:bg-gray-700 flex-shrink-0"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
            
            {/* Logo/Site Name - TeachersHubb (White text for contrast) */}
            <button
              onClick={() => navigate('/')} 
              className="text-lg sm:text-xl lg:text-2xl font-bold text-white dark:text-blue-400 truncate"
            >
              TeachersHubb
            </button>
          </div>
          
          {/* CENTER SECTION: Search Bar (Desktop) */}
          <div className="flex items-center flex-1 justify-center mx-2 sm:mx-4 min-w-0">
            <div className="w-full max-w-lg hidden lg:block">
              <SearchBar />
            </div>
            
            {/* Search Icon (Visible on small screens) */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-full text-white hover:bg-blue-800 dark:text-gray-300 dark:hover:bg-gray-700 flex-shrink-0"
            >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* RIGHT SECTION: Icons and Profile */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-white hover:bg-blue-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              title={language === 'en' ? 'Switch to Telugu' : 'Switch to English'}
            >
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">
                {language === 'en' ? 'EN' : 'తె'}
              </span>
            </button>

            {/* Notifications */}
            <div className="relative flex-shrink-0">
              <NotificationDropdown socket={socket} />
            </div>

            {/* Profile Dropdown (White button/icon) */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center p-0.5 sm:p-1 rounded-full text-white hover:bg-blue-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Placeholder for Profile Picture/Icon - kept blue-100 for contrast/design element */}
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-white/30 rounded-full flex items-center justify-center dark:bg-blue-900">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white dark:text-blue-400" />
                </div>
              </button>

              {isProfileOpen && (
                // Dropdown remains white/gray for better readability against the main page content
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 z-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 dark:text-white dark:border-gray-600">
                    <div className="font-medium">{user?.email}</div>
                    <div className="text-gray-500 capitalize">{user?.role}</div>
                  </div>
                  {user?.role !== 'admin' && (
                    <button
                      onClick={() => {
                        navigate(`/${user?.role}/profile`)
                        setIsProfileOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('profile')}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
              <SearchBar />
          </div>
          
          {/* Language Toggle (Mobile Only) */}
          <div className="sm:hidden px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 rounded-md"
            >
              <Globe className="h-5 w-5" />
              <span>{language === 'en' ? 'English' : 'Telugu'}</span>
            </button>
          </div>

          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Navigation Items (excluding Profile) */}
            {sidebarItems.filter(item => item.name !== 'Profile').map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center w-full px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    item.current 
                      ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              )
            })}
            
            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            
            {/* Profile and Logout */}
            {user?.role !== 'admin' && (
              <button
                onClick={() => {
                  navigate(`/${user?.role}/profile`)
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 rounded-md"
              >
                <User className="h-5 w-5 mr-3" />
                {t('profile')}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 rounded-md"
            >
              <LogOut className="h-5 w-5 mr-3" />
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar