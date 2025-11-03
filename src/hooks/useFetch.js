import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api(url, options)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url, JSON.stringify(options)])

  useEffect(() => {
    if (url) {
      fetchData()
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

export const usePost = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const post = useCallback(async (url, data) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.post(url, data)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { post, loading, error }
}

export const usePut = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const put = useCallback(async (url, data) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.put(url, data)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { put, loading, error }
}

export const useDelete = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const del = useCallback(async (url) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.delete(url)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { del, loading, error }
}

export default useFetch








