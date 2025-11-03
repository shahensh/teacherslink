import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      try {
        // Validate JWT token format
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          throw new Error('Invalid JWT token format')
        }
        
        const parsedUser = JSON.parse(user)
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: parsedUser, token }
        })
      } catch (error) {
        console.error('Invalid stored auth data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid stored data' })
      }
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: null })
    }
  }, [])

  const login = async (credentials) => {
    try {
      console.log('Attempting login with credentials:', credentials)
      dispatch({ type: 'AUTH_START' })
      const response = await authApi.login(credentials)
      
      console.log('Login response:', response)
      
      if (response.success) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token }
        })
        
        toast.success('Login successful!')
        return { success: true }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authApi.register(userData)
      
      if (response.success) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token }
        })
        
        toast.success('Registration successful!')
        return { success: true }
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    authApi.logout()
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext





