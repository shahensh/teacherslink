import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const SchoolLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/school',
      icon: 'Home',
      current: location.pathname === '/school'
    },
    {
      name: 'Job Posting',
      href: '/school/jobs',
      icon: 'FileText',
      current: location.pathname === '/school/jobs' || location.pathname === '/school/post-job'
    },
    {
      name: 'Applicants',
      href: '/school/applicants',
      icon: 'Users',
      current: location.pathname === '/school/applicants'
    },
    {
      name: 'Blog & Forum',
      href: '/school/blog',
      icon: 'BookOpen',
      current: location.pathname === '/school/blog'
    },
    {
      name: 'Webinars',
      href: '/school/webinars',
      icon: 'Video',
      current: location.pathname === '/school/webinars'
    },
    {
      name: 'Messages',
      href: '/school/chat',
      icon: 'MessageCircle',
      current: location.pathname.startsWith('/school/chat')
    },
    {
      name: 'Profile',
      href: '/school/profile',
      icon: 'User',
      current: location.pathname === '/school/profile'
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

export default SchoolLayout





