import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const TeacherLayout = () => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarItems = [
    {
      name: t('dashboard'),
      href: '/teacher',
      icon: 'Home',
      current: location.pathname === '/teacher'
    },
    {
      name: t('jobs'),
      href: '/teacher/jobs',
      icon: 'Search',
      current: location.pathname === '/teacher/jobs'
    },
    {
      name: t('applications'),
      href: '/teacher/applications',
      icon: 'FileText',
      current: location.pathname === '/teacher/applications'
    },
    {
      name: t('blog'),
      href: '/teacher/blog',
      icon: 'BookOpen',
      current: location.pathname === '/teacher/blog'
    },
    {
      name: t('webinars'),
      href: '/teacher/webinars',
      icon: 'Video',
      current: location.pathname === '/teacher/webinars'
    },
    {
      name: t('messages'),
      href: '/teacher/chat',
      icon: 'MessageCircle',
      current: location.pathname.startsWith('/teacher/chat')
    },
    {
      name: t('profile'),
      href: '/teacher/profile',
      icon: 'User',
      current: location.pathname === '/teacher/profile'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={sidebarItems} user={user} logout={logout} />
      <div className="lg:pl-64">
        <Navbar user={user} logout={logout} sidebarItems={sidebarItems} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout





