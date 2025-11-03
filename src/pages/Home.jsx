import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useSocket } from '../context/SocketContext'
import { Building, Users, Search, MessageCircle, Star, CheckCircle, LogIn, UserPlus, Instagram, Linkedin, Facebook, ArrowRight, Play, Award, Zap, Menu, X, Shield, Calendar, FileText } from 'lucide-react'
import api from '../api/axios'

const Home = () => {
    const { isAuthenticated, user } = useAuth()
    const { t } = useLanguage()
    const { socket, isConnected } = useSocket()
    const [activeFaqTab, setActiveFaqTab] = useState('job-seekers')
    const [isVisible, setIsVisible] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalTeachers: 0,
        totalSchools: 0,
        successfulHires: 0
    })
    const [loading, setLoading] = useState(true)

    // Fetch initial stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                console.log('🔍 Fetching stats from /api/stats/public...')
                const response = await api.get('/api/stats/public')
                console.log('📊 Stats response:', response.data)
                if (response.data.success) {
                    console.log('✅ Setting stats:', response.data.stats)
                    setStats(response.data.stats)
                } else {
                    console.error('❌ Stats fetch failed - no success flag')
                }
            } catch (error) {
                console.error('❌ Error fetching stats:', error)
                console.error('Error details:', error.response?.data || error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    // Listen for real-time stats updates
    useEffect(() => {
        if (!socket || !isConnected) return

        const handleStatsUpdate = (updatedStats) => {
            console.log('Stats updated:', updatedStats)
            setStats(prev => ({ ...prev, ...updatedStats }))
        }

        socket.on('stats_updated', handleStatsUpdate)

        return () => {
            socket.off('stats_updated', handleStatsUpdate)
        }
    }, [socket, isConnected])

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const features = [
        {
            icon: <Building className="h-12 w-12 text-blue-600" />,
            title: 'For Schools',
            description: 'Powerful hiring tools to find the perfect teachers',
            features: ['Unlimited job postings', 'Advanced ATS system', 'Real-time analytics', 'Applicant tracking', 'Direct messaging', 'Rating & reviews'],
            bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200',
            iconBg: 'bg-blue-100'
        },
        {
            icon: <Users className="h-12 w-12 text-orange-600" />,
            title: 'For Teachers',
            description: 'Find your dream teaching job with ease',
            features: ['Browse 500+ jobs', 'One-click apply', 'Auto-resume generation', 'Track applications', 'Direct school chat', 'Job recommendations'],
            bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
            borderColor: 'border-orange-200',
            iconBg: 'bg-orange-100'
        },
        {
            icon: <MessageCircle className="h-12 w-12 text-green-600" />,
            title: 'Real-Time Communication',
            description: 'Connect instantly with schools & teachers',
            features: ['Instant messaging', 'File sharing', 'Application chat', 'Live notifications', 'Message history', 'Mobile friendly'],
            bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            iconBg: 'bg-green-100'
        }
    ]

    const advancedFeatures = [
        {
            icon: <Star className="h-8 w-8 text-yellow-600" />,
            title: 'School Ratings & Reviews',
            description: 'Read authentic reviews from teachers about schools. Help others make informed decisions.',
            color: 'from-yellow-50 to-yellow-100',
            iconColor: 'bg-yellow-100'
        },
        {
            icon: <Award className="h-8 w-8 text-purple-600" />,
            title: 'Social Feed & Community',
            description: 'Share updates, engage with posts, and build your professional network in education.',
            color: 'from-purple-50 to-purple-100',
            iconColor: 'bg-purple-100'
        },
        {
            icon: <FileText className="h-8 w-8 text-indigo-600" />,
            title: 'Blog & Resources',
            description: 'Access educational content, teaching tips, and hiring guides from industry experts.',
            color: 'from-indigo-50 to-indigo-100',
            iconColor: 'bg-indigo-100'
        },
        {
            icon: <Calendar className="h-8 w-8 text-pink-600" />,
            title: 'Webinars & Events',
            description: 'Join live webinars, workshops, and networking events for professional development.',
            color: 'from-pink-50 to-pink-100',
            iconColor: 'bg-pink-100'
        },
        {
            icon: <Shield className="h-8 w-8 text-blue-600" />,
            title: 'Content Moderation',
            description: 'AI-powered image moderation ensures a safe and professional environment for everyone.',
            color: 'from-blue-50 to-blue-100',
            iconColor: 'bg-blue-100'
        },
        {
            icon: <Zap className="h-8 w-8 text-orange-600" />,
            title: 'Live Updates',
            description: 'Real-time job postings, application updates, and instant notifications keep you informed.',
            color: 'from-orange-50 to-orange-100',
            iconColor: 'bg-orange-100'
        }
    ]

    const statsDisplay = [
        { label: t('activeJobs'), value: loading ? '...' : `${stats.activeJobs}+`, color: 'text-blue-600' },
        { label: t('qualifiedTeachers'), value: loading ? '...' : `${stats.totalTeachers}+`, color: 'text-orange-600' },
        { label: t('registeredSchools'), value: loading ? '...' : `${stats.totalSchools}+`, color: 'text-green-600' }
    ]

    const faqData = {
        'job-seekers': [
            {
                question: "Is your job portal free for job seekers?",
                answer: "Yes, Creating a profile and applying to jobs on Teachers Link is absolutely free."
            },
            {
                question: "What types of job opportunities are available on your portal?",
                answer: "Our portal features a diverse range of teaching and non-teaching job listings, including part-time, and full-time positions across various schools from India."
            },
            {
                question: "How can I create a profile on your portal?",
                answer: "To create a profile, simply click on Sign Up, and follow the prompts to fill in your details and upload your resume."
            }
        ],
        'schools': [
            {
                question: "How much does it cost to post jobs on Teachers Link?",
                answer: "We offer flexible pricing plans starting from free basic listings to premium packages with advanced features and priority placement."
            },
            {
                question: "How quickly can I find qualified teachers?",
                answer: "Most schools find suitable candidates within 1-2 weeks of posting. Our platform connects you with pre-verified teachers actively seeking opportunities."
            },
            {
                question: "Can I manage multiple job postings at once?",
                answer: "Yes, our dashboard allows you to manage unlimited job postings, track applications, schedule interviews, and communicate with candidates all in one place."
            }
        ]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50 relative overflow-hidden">
            {/* Modern Background Pattern */}
            <div className="absolute inset-0 bg-white/80"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-orange-100/30"></div>

            {/* Subtle animated elements */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-subtle-pulse"></div>
            <div className="absolute bottom-20 left-20 w-40 h-40 bg-orange-200/20 rounded-full blur-xl animate-subtle-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Navigation */}
            <nav className="relative z-10 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 lg:h-20">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center group">
                                {/* Logo Image */}
                                <img
                                    src="/teachershubb-logo.svg"
                                    alt="TeachersHubb Logo"
                                    className="h-8 lg:h-10 w-auto group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="ml-2 lg:ml-3 text-lg lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">TeachersHubb</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                             <Link to="/for-schools" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300">
                                 Plans
                             </Link>
                            <span className="hidden lg:inline-block h-8 w-px bg-gray-300" />
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-600 text-sm hidden lg:block">{t('welcome')}, {user?.email}</span>
                                    <Link
                                        to={user?.role === 'admin' ? '/admin' : user?.role === 'school' ? '/school' : '/teacher'}
                                        className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm lg:text-base"
                                    >
                                        <Zap className="h-4 w-4" />
                                        <span className="hidden lg:inline">{t('dashboard')}</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 lg:space-x-4">
                                     <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors duration-300 text-sm lg:text-base">
                                         <LogIn className="h-4 lg:h-5 w-4 lg:w-5" />
                                         <span className="hidden lg:inline">{t('login')}</span>
                                     </Link>
                                     <Link to="/register" className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold px-4 lg:px-6 py-2 lg:py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm lg:text-base">
                                         <UserPlus className="h-4 lg:h-5 w-4 lg:w-5" />
                                         <span className="hidden lg:inline">{t('getStartedFree')}</span>
                                     </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-600 hover:text-blue-600 transition-colors duration-300 p-2"
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-200">
                            <div className="flex flex-col space-y-4">
                                 <Link
                                     to="/for-schools"
                                     className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 px-4 py-2"
                                     onClick={() => setIsMobileMenuOpen(false)}
                                 >
                                     Plans
                                 </Link>
                                {isAuthenticated ? (
                                    <div className="px-4 py-2">
                                        <span className="text-gray-600 text-sm block mb-2">{t('welcome')}, {user?.email}</span>
                                        <Link
                                            to={user?.role === 'admin' ? '/admin' : user?.role === 'school' ? '/school' : '/teacher'}
                                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-4 py-2 rounded-full hover:shadow-lg transition-all duration-300"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <Zap className="h-4 w-4" />
                                            {t('dashboard')}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col space-y-2 px-4">
                                         <Link
                                             to="/login"
                                             className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors duration-300 py-2"
                                             onClick={() => setIsMobileMenuOpen(false)}
                                         >
                                             <LogIn className="h-5 w-5" />
                                             {t('login')}
                                         </Link>
                                         <Link
                                             to="/register"
                                             className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold px-4 py-2 rounded-full hover:shadow-lg transition-all duration-300"
                                             onClick={() => setIsMobileMenuOpen(false)}
                                         >
                                             <UserPlus className="h-5 w-5" />
                                             {t('getStartedFree')}
                                         </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 pt-12 pb-20 lg:pt-20 lg:pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                             <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 lg:mb-8 text-gray-900 leading-tight px-4">
                                 {t('connectSchoolsWith')}
                                 <span className="block bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                                     {t('amazingTeachers')}
                                 </span>
                             </h1>
                             <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
                                 {t('ultimatePlatform')}
                             </p>
                        </div>

                        <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center transition-all duration-700 delay-200 px-4 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                             <Link
                                 to="/register"
                                 className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold text-base sm:text-lg rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                             >
                                 {t('getStartedFree')}
                                 <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                             </Link>
                             <Link
                                 to="/login"
                                 className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-blue-500 text-blue-600 font-bold text-base sm:text-lg rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                             >
                                 <Play className="h-4 sm:h-5 w-4 sm:w-5" />
                                 {t('watchDemo')}
                             </Link>
                        </div>

                        {/* Modern floating elements */}
                        <div className="hidden lg:block absolute top-20 left-10 w-20 h-20 bg-orange-200/30 rounded-full animate-subtle-pulse"></div>
                        <div className="hidden lg:block absolute top-40 right-20 w-16 h-16 bg-blue-200/30 rounded-full animate-subtle-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative z-10 py-12 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center mb-8">
                        {isConnected && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Live Statistics
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {statsDisplay.map((stat, index) => (
                            <div
                                key={index}
                                className={`text-center p-4 sm:p-6 bg-white rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 group ${isVisible ? 'animate-fade-in-up' : ''}`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 ${stat.color} transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 font-medium text-sm sm:text-base">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Core Features Section */}
            <div className="relative z-10 py-12 lg:py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 text-gray-900 px-4">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                            Powerful features designed for schools and teachers
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group relative p-6 lg:p-8 bg-white rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-xl border ${feature.borderColor} transition-all duration-300 hover:-translate-y-2`}
                            >
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-4 lg:mb-6">
                                        <div className={`p-3 lg:p-4 ${feature.iconBg} rounded-xl lg:rounded-2xl group-hover:scale-110 transition-all duration-300`}>
                                            {feature.icon}
                                        </div>
                                    </div>
                                    <h3 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4 text-gray-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4 lg:mb-6 text-base lg:text-lg leading-relaxed">
                                        {feature.description}
                                    </p>
                                    <ul className="space-y-2 lg:space-y-3">
                                        {feature.features.map((item, itemIndex) => (
                                            <li key={itemIndex} className="flex items-center text-gray-600 text-sm lg:text-base group-hover:text-gray-900 transition-colors duration-300">
                                                <CheckCircle className="h-4 lg:h-5 w-4 lg:w-5 text-green-500 mr-2 lg:mr-3 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Advanced Features Grid */}
            <div className="relative z-10 py-12 lg:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                            More Amazing Features
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need in one powerful platform
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {advancedFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className={`group p-6 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1`}
                            >
                                <div className={`inline-flex p-3 ${feature.iconColor} rounded-xl mb-4 group-hover:scale-110 transition-all duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="relative z-10 py-12 lg:py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                            Why Teachers & Schools Love Us
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Join thousands who have found success on our platform
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {loading ? '...' : `${stats.activeJobs}+`}
                            </div>
                            <div className="text-gray-600 font-medium">Active Jobs</div>
                            <p className="text-sm text-gray-500 mt-2">Updated in real-time</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                            <div className="text-4xl font-bold text-orange-600 mb-2">
                                {loading ? '...' : `${stats.totalTeachers}+`}
                            </div>
                            <div className="text-gray-600 font-medium">Qualified Teachers</div>
                            <p className="text-sm text-gray-500 mt-2">Verified profiles</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                {loading ? '...' : `${stats.totalSchools}+`}
                            </div>
                            <div className="text-gray-600 font-medium">Schools</div>
                            <p className="text-sm text-gray-500 mt-2">Trusted partners</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="relative z-10 py-12 lg:py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 px-4">
                            {t('frequentlyAsked')}
                        </h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 lg:mb-12 px-4">
                            <button
                                onClick={() => setActiveFaqTab('job-seekers')}
                                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 ${
                                    activeFaqTab === 'job-seekers'
                                        ? 'bg-orange-500 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                                    }`}
                            >
                                {t('forJobSeekers')}
                            </button>
                            <button
                                onClick={() => setActiveFaqTab('schools')}
                                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 ${
                                    activeFaqTab === 'schools'
                                        ? 'bg-orange-500 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                                    }`}
                            >
                                {t('forSchools')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg border border-gray-200 p-6 sm:p-8 max-w-4xl mx-auto">
                        <div className="space-y-6 lg:space-y-8">
                            {faqData[activeFaqTab].map((faq, index) => (
                                <div key={index} className="group">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 lg:mb-4 group-hover:text-blue-600 transition-colors duration-300">{faq.question}</h3>
                                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                                        {faq.answer.includes('Sign Up') ? (
                                            <>
                                                {faq.answer.split('Sign Up')[0]}
                                                <Link to="/register" className="text-orange-500 font-bold hover:text-orange-600 transition-colors duration-300">Sign Up</Link>
                                                {faq.answer.split('Sign Up')[1]}
                                            </>
                                        ) : (
                                            faq.answer
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative z-10 py-12 lg:py-20 bg-gradient-to-br from-orange-400 to-orange-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 text-white px-4">
                            {t('readyToGetStarted')}
                        </h2>
                        <p className="text-lg sm:text-xl text-white/90 mb-8 lg:mb-10 max-w-2xl mx-auto px-4">
                            {t('joinThousands')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
                            <Link
                                to="/register"
                                className="group px-8 sm:px-10 py-3 sm:py-4 bg-white text-orange-600 font-bold text-base sm:text-lg rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <Award className="h-4 sm:h-5 w-4 sm:w-5" />
                                {t('createYourAccount')}
                                <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                            <Link
                                to="/for-schools"
                                className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-white text-white font-bold text-base sm:text-lg rounded-full hover:bg-white hover:text-orange-600 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                {t('learnMore')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 py-12 lg:py-16 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div>
                            <div className="flex items-center mb-4 lg:mb-6">
                                <img
                                    src="/teachershubb-logo.svg"
                                    alt="TeachersHubb Logo"
                                    className="h-8 lg:h-10 w-auto"
                                />
                                <span className="ml-2 lg:ml-3 text-lg lg:text-2xl font-bold text-white">TeachersHubb</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed text-sm lg:text-base">{t('connectingEducators')}</p>
                        </div>
                        <div>
                            <h4 className="text-base lg:text-lg font-bold mb-4 lg:mb-6 text-white">{t('importantLinks')}</h4>
                            <ul className="space-y-2 lg:space-y-3 text-gray-300 text-sm lg:text-base">
                                <li><Link to="/about" className="hover:text-orange-400 transition-colors duration-300">{t('aboutUs')}</Link></li>
                                <li><Link to="/contact" className="hover:text-orange-400 transition-colors duration-300">{t('contactUs')}</Link></li>
                                <li><Link to="/for-teachers" className="hover:text-orange-400 transition-colors duration-300">{t('forTeachers')}</Link></li>
                                <li><Link to="/for-schools" className="hover:text-orange-400 transition-colors duration-300">{t('forSchools')}</Link></li>
                                <li><Link to="/register" className="hover:text-orange-400 transition-colors duration-300">{t('signupForFree')}</Link></li>
                                <li><Link to="/login" className="hover:text-orange-400 transition-colors duration-300">{t('loginHere')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-base lg:text-lg font-bold mb-4 lg:mb-6 text-white">{t('followUsOn')}</h4>
                            <div className="flex items-center gap-3 lg:gap-4">
                                <a href="#" aria-label="LinkedIn" className="p-2 lg:p-3 bg-gray-800 rounded-full hover:bg-orange-500 transition-all duration-300">
                                    <Linkedin className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                                </a>
                                <a href="#" aria-label="Instagram" className="p-2 lg:p-3 bg-gray-800 rounded-full hover:bg-orange-500 transition-all duration-300">
                                    <Instagram className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                                </a>
                                <a href="#" aria-label="Facebook" className="p-2 lg:p-3 bg-gray-800 rounded-full hover:bg-orange-500 transition-all duration-300">
                                    <Facebook className="h-4 lg:h-5 w-4 lg:w-5 text-white" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-gray-700 text-center">
                        <p className="text-gray-400 mb-3 lg:mb-4 text-xs lg:text-sm">
                            <Link to="/privacy" className="hover:text-orange-400 transition-colors duration-300">{t('privacyPolicy')}</Link> |
                            <Link to="/terms" className="hover:text-orange-400 transition-colors duration-300"> {t('termsConditions')}</Link> |
                            <Link to="/fraud" className="hover:text-orange-400 transition-colors duration-300"> {t('fraudAlert')}</Link>
                        </p>
                        <p className="text-gray-400 text-xs lg:text-sm">TeachersHubb © {new Date().getFullYear()}, {t('allRightsReserved')}.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home