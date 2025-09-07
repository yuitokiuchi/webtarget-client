// src/lib/authApi.ts

/**
 * This file contains the API client for making authenticated requests to the backend.
 */

import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken = ''

// Request interceptor to add the access token to headers
authApi.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {}
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Refresh token logic
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      // Get new access token using refresh token
      try {
        const res = await axios.post(
          '/auth/refresh',
          {},
          {
            baseURL: authApi.defaults.baseURL,
            withCredentials: true // to send cookies
          }
        )
        const data = res.data as { access_token: string }
        accessToken = data.access_token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return authApi(originalRequest)
      } catch (refreshError) {
        // Handle refresh token failure
        // e.g. log out
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export function setAccessToken(token: string) {
  accessToken = token
}

export default authApi