import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building, CheckCircle, ArrowRight, Linkedin, Instagram, Facebook, Star, Zap, Crown, Users, MessageCircle, FileText, Calendar, Award, Clock, Shield, RefreshCw, ArrowLeft } from 'lucide-react'
import api from '../api/axios'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

const ForSchools = () => {
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [billingCycle, setBillingCycle] = useState('monthly')

  // Fetch plans from API
  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/plans')
      const activePlans = response.data.filter(plan => plan.isActive)
      setPlans(activePlans)
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to load plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPlans()
  }, [])

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !isConnected) return

    const handlePlanCreated = (planData) => {
      console.log('New plan created:', planData)
      if (planData.isActive) {
        setPlans(prev => [...prev, planData])
        toast.success(`New plan added: ${planData.title}`)
      }
    }

    const handlePlanUpdated = (planData) => {
      console.log('Plan updated:', planData)
      setPlans(prev => 
        prev.map(plan => 
          plan._id === planData._id ? planData : plan
        ).filter(plan => plan.isActive)
      )
    }

    const handlePlanDeleted = (planId) => {
      console.log('Plan deleted:', planId)
      setPlans(prev => prev.filter(plan => plan._id !== planId))
      toast.info('A plan has been removed')
    }

    socket.on('plan_created', handlePlanCreated)
    socket.on('plan_updated', handlePlanUpdated)
    socket.on('plan_deleted', handlePlanDeleted)

    return () => {
      socket.off('plan_created', handlePlanCreated)
      socket.off('plan_updated', handlePlanUpdated)
      socket.off('plan_deleted', handlePlanDeleted)
    }
  }, [socket, isConnected])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0 bg-white/80"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-orange-100/30"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/teachershubb-logo.svg" 
                  alt="TeachersHubb Logo" 
                  className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                />
                <span className="ml-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">TeachersHubb</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/register" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300">
                Get Started
              </Link>
              <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-all duration-300 hover:gap-3 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:transform group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
                Choose Your
                <span className="block bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                  Plan
                </span>
              </h1>
              {isConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </div>
              )}
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Find the perfect plan for your needs. Plans are updated in real-time by our admins.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Crown className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Plans Available</h3>
              <p className="text-gray-600">Plans will appear here once admin adds them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={plan._id}
                  className="relative bg-white rounded-3xl shadow-xl border-2 border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Plan Type Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {plan.price === 0 && (
                      <span className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Free Plan
                      </span>
                    )}
                    {plan.userType === 'teacher' && (
                      <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        For Teachers
                      </span>
                    )}
                  </div>
                  
                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 mb-4">
                        {plan.userType === 'school' ? <Building className="h-8 w-8 text-white" /> : <Users className="h-8 w-8 text-white" />}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                      <p className="text-gray-600 mb-4">{plan.description || 'Flexible plan for your needs'}</p>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                        <span className="text-gray-600 ml-2">
                          /{plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        {plan.durationMonths} month{plan.durationMonths !== 1 ? 's' : ''} validity
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      {plan.features && plan.features.length > 0 ? (
                        plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 bg-green-100 mt-0.5">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-900">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No features listed</p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/register"
                      className="w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:shadow-lg hover:scale-105"
                    >
                      {plan.price === 0 ? 'Start Free' : 'Get Started'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="relative z-10 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TeachersHubb?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the tools and features schools need to find and hire the best teachers efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: 'Access to Qualified Teachers',
                description: 'Connect with thousands of verified and qualified teachers from across India.'
              },
              {
                icon: <Zap className="h-8 w-8 text-orange-600" />,
                title: 'Fast Hiring Process',
                description: 'Streamlined application process with real-time notifications and instant communication.'
              },
              {
                icon: <Shield className="h-8 w-8 text-green-600" />,
                title: 'Verified Profiles',
                description: 'All teacher profiles are verified with background checks and document validation.'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="inline-flex p-4 rounded-2xl bg-gray-100 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/teachershubb-logo.svg" 
                  alt="TeachersHubb Logo" 
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-lg font-bold text-white">TeachersHubb</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                Connecting schools with amazing teachers across India. Simple, fast, and reliable hiring platform that transforms the way schools find qualified educators.
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">Important Links</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/for-schools" className="hover:text-orange-400 transition-colors duration-300">For Schools</Link></li>
                <li><Link to="/teacher/jobs" className="hover:text-orange-400 transition-colors duration-300">Find a Job</Link></li>
                <li><Link to="/about" className="hover:text-orange-400 transition-colors duration-300">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-orange-400 transition-colors duration-300">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">Follow us on</h4>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="LinkedIn" className="p-2 bg-gray-800 rounded-full hover:bg-orange-500 transition-all duration-300">
                  <Linkedin className="h-4 w-4 text-white" />
                </a>
                <a href="#" aria-label="Instagram" className="p-2 bg-gray-800 rounded-full hover:bg-orange-500 transition-all duration-300">
                  <Instagram className="h-4 w-4 text-white" />
                </a>
                <a href="#" aria-label="Facebook" className="p-2 bg-gray-800 rounded-full hover:bg-orange-500 transition-all duration-300">
                  <Facebook className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 mb-3 text-xs">
              <Link to="/privacy" className="hover:text-orange-400 transition-colors duration-300">Privacy Policy</Link> | 
              <Link to="/terms" className="hover:text-orange-400 transition-colors duration-300"> Terms & Conditions</Link> | 
              <Link to="/fraud" className="hover:text-orange-400 transition-colors duration-300"> Fraud Alert</Link>
            </p>
            <p className="text-gray-400 text-xs">TeachersHubb © {new Date().getFullYear()}, All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ForSchools




