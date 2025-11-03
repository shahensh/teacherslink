import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, HelpCircle, Upload, MapPin, Briefcase, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import GlassCard from '../../components/GlassCard'
import LiquidBackground from '../../components/LiquidBackground'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState('teacher')
  const { register: registerUser, isLoading } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    // Filter data based on user type to avoid sending unnecessary fields
    let filteredData = {
      email: data.email,
      password: data.password,
      role: userType // Use userType directly instead of data.role
    }

    if (userType === 'teacher') {
      filteredData.firstName = data.firstName
      filteredData.lastName = data.lastName
      filteredData.phone = data.phone
    } else if (userType === 'school') {
      filteredData.schoolName = data.schoolName
      filteredData.description = data.description
      filteredData.phone = data.phone
      filteredData.city = data.city
      filteredData.state = data.state
      filteredData.pincode = data.pincode
    }

    const result = await registerUser(filteredData)
    if (result.success) {
      // Redirect based on user type from the form
      if (userType === 'admin') {
        navigate('/admin')
      } else if (userType === 'school') {
        navigate('/school')
      } else if (userType === 'teacher') {
        navigate('/register/teacher-details', { state: { userId: result.user?._id } })
      }
    }
  }

  return (
    <LiquidBackground className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full relative">
        {/* Glass Effect Card */}
        <GlassCard>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('selectInstitutionType')}</h2>
          </div>

          {/* Profile Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Teacher Card */}
            <div
              onClick={() => setUserType('teacher')}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                userType === 'teacher'
                  ? 'border-blue-500 bg-white/40 shadow-lg'
                  : 'border-gray-300 bg-white/20 hover:bg-white/30'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('teacher')}</h3>
                <p className="text-sm text-gray-600">{t('createAccount')} & {t('applyWithOneClick')} - {t('free')}!</p>
              </div>
            </div>

            {/* School Card */}
            <div
              onClick={() => setUserType('school')}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                userType === 'school'
                  ? 'border-green-500 bg-white/40 shadow-lg'
                  : 'border-gray-300 bg-white/20 hover:bg-white/30'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Building className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('school')}</h3>
                <p className="text-sm text-gray-600">{t('createAccount')} {t('school')} {t('profile')} {t('and')} {t('start')} {t('hiring')}</p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('role', { value: userType })} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('firstName')} *
                  <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    {...register('firstName', {
                      required: 'First name is required'
                    })}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder={t('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('lastName')} *
                  <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    {...register('lastName', {
                      required: 'Last name is required'
                    })}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder={t('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('email')} *
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder={t('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('password')} *
                  <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder={t('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('confirmPassword')} *
                  <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder={t('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('mobileNumber')} *
                <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  {...register('phone', {
                    required: 'Phone number is required'
                  })}
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Enter 10-Digits Mobile Number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {userType === 'school' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    School / Institution Name *
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      {...register('schoolName', {
                        required: 'School name is required'
                      })}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                      placeholder="Enter Organization Name"
                    />
                  </div>
                  {errors.schoolName && (
                    <p className="mt-1 text-sm text-red-600">{errors.schoolName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    School Description *
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </label>
                  <textarea
                    {...register('description', {
                      required: 'School description is required',
                      minLength: {
                        value: 10,
                        message: 'Description must be at least 10 characters'
                      }
                    })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm resize-none"
                    placeholder="Describe your school, its mission, and what makes it special..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution Type *
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <select
                      {...register('institutionType', {
                        required: 'Institution type is required'
                      })}
                      className="w-full pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm appearance-none"
                    >
                      <option value="">Select Institution Type</option>
                      <option value="public">Public School</option>
                      <option value="private">Private School</option>
                      <option value="international">International School</option>
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {errors.institutionType && (
                    <p className="mt-1 text-sm text-red-600">{errors.institutionType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Designation *
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      {...register('designation', {
                        required: 'Designation is required'
                      })}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your role at this school"
                    />
                  </div>
                  {errors.designation && (
                    <p className="mt-1 text-sm text-red-600">{errors.designation.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution Website
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      {...register('website')}
                      type="url"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your institution website here"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                    <HelpCircle className="inline w-4 h-4 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      {...register('location', {
                        required: 'Location is required'
                      })}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your institution City, State here"
                    />
                  </div>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </>
            )}


            {userType === 'teacher' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Locations
                </label>
                <input
                  {...register('preferredLocations')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Enter your preferred location or city"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t('loading') : t('createAccount')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                {t('signIn')}
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </LiquidBackground>
  )
}

export default Register

