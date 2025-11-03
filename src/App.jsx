import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import SchoolLayout from './layouts/SchoolLayout'
import TeacherLayout from './layouts/TeacherLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import TeacherRegister from './pages/auth/TeacherRegister'
import ResetPassword from './pages/auth/ResetPassword'
import ForSchools from './pages/ForSchools'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AllJobs from './pages/admin/AllJobs'
import AdminBlog from './pages/admin/Blog'
import AdminWebinars from './pages/admin/Webinars'
import ManageSchools from './pages/admin/ManageSchools'
import VerifyTeachers from './pages/admin/VerifyTeachers'
import AdminTeachers from './pages/admin/Teachers'
import PlansManager from './pages/admin/PlansManager'

// School Pages
import SchoolDashboard from './pages/school/Dashboard'
import PostJob from './pages/school/PostJob'
import SchoolJobs from './pages/school/Jobs'
import Applicants from './pages/school/Applicants'
import SchoolBlog from './pages/school/Blog'
import SchoolWebinars from './pages/school/Webinars'
import SchoolProfile from './pages/school/Profile'
import PublicSchoolProfile from './pages/school/PublicSchoolProfile'

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherJobs from './pages/teacher/Jobs'
import JobDetails from './pages/teacher/JobDetails'
import Applications from './pages/teacher/Applications'
import TeacherBlog from './pages/teacher/Blog'
import TeacherWebinars from './pages/teacher/Webinars'
import TeacherProfile from './pages/teacher/Profile'

// Chat
import ChatRoom from './pages/chat/ChatRoom'

// Search
import SearchResults from './pages/SearchResults'

// Components
import PrivateRoute from './routes/PrivateRoute'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/s/:slug" element={<PublicSchoolProfile />} />
                <Route path="/for-schools" element={<ForSchools />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/teacher-details" element={<TeacherRegister />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </PrivateRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="jobs" element={<AllJobs />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="webinars" element={<AdminWebinars />} />
                  <Route path="schools" element={<ManageSchools />} />
                  <Route path="teachers" element={<AdminTeachers />} />
                  <Route path="plans" element={<PlansManager />} />
                  <Route path="teacher/profile/:id" element={<TeacherProfile />} />
                  <Route path="school/profile/:id" element={<SchoolProfile />} />
                </Route>

                {/* School Routes */}
                <Route path="/school" element={
                  <PrivateRoute allowedRoles={['school']}>
                    <SchoolLayout />
                  </PrivateRoute>
                }>
                  <Route index element={<SchoolDashboard />} />
                  <Route path="jobs" element={<SchoolJobs />} />
                  <Route path="post-job" element={<PostJob />} />
                  <Route path="applicants" element={<Applicants />} />
                  <Route path="blog" element={<SchoolBlog />} />
                  <Route path="webinars" element={<SchoolWebinars />} />
                  <Route path="profile" element={<SchoolProfile />} />
                  <Route path="profile/:id" element={<SchoolProfile />} />
                  <Route path="teacher/profile/:id" element={<TeacherProfile />} />
                  <Route path="chat" element={<ChatRoom />} />
                </Route>

                {/* Teacher Routes */}
                <Route path="/teacher" element={
                  <PrivateRoute allowedRoles={['teacher']}>
                    <TeacherLayout />
                  </PrivateRoute>
                }>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="jobs" element={<TeacherJobs />} />
                  <Route path="jobs/:id" element={<JobDetails />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="blog" element={<TeacherBlog />} />
                  <Route path="webinars" element={<TeacherWebinars />} />
                  <Route path="profile" element={<TeacherProfile />} />
                  <Route path="profile/:id" element={<TeacherProfile />} />
                  <Route path="school/profile/:id" element={<SchoolProfile />} />
                  <Route path="chat" element={<ChatRoom />} />
                </Route>

                {/* Search Routes */}
                <Route path="/search" element={
                  <PrivateRoute allowedRoles={['teacher', 'school']}>
                    <SearchResults />
                  </PrivateRoute>
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Toaster position="top-right" />
          </Router>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App





