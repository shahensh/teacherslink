import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: 'Home',
      current: location.pathname === '/admin'
    },
    {
      name: 'All Users',
      href: '/admin/users',
      icon: 'Users',
      current: location.pathname === '/admin/users'
    },
    {
      name: 'All Jobs',
      href: '/admin/jobs',
      icon: 'Briefcase',
      current: location.pathname === '/admin/jobs'
    },
    {
      name: 'Blog & Forum',
      href: '/admin/blog',
      icon: 'FileText',
      current: location.pathname === '/admin/blog'
    },
    {
      name: 'Webinars',
      href: '/admin/webinars',
      icon: 'Video',
      current: location.pathname === '/admin/webinars'
    },
    {
      name: 'Manage Schools',
      href: '/admin/schools',
      icon: 'Building',
      current: location.pathname === '/admin/schools'
    },
    {
      name: 'Verify Teachers',
      href: '/admin/teachers',
      icon: 'UserCheck',
      current: location.pathname === '/admin/teachers'
    },
    {
      name: 'Plans',
      href: '/admin/plans',
      icon: 'CreditCard',
      current: location.pathname === '/admin/plans'
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

export default AdminLayout





