// api.ts
// -------------------------------
// Enhanced Axios client with JWT Authorization, error handling, and retry logic

/// <reference types="vite/client" />
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import useAuthStore from '../stores/authStore'
import useUIStore from '../stores/uiStore'
import { errorRecoveryService } from './errorRecovery'

// Queue for offline requests
interface QueuedRequest {
  config: AxiosRequestConfig
  resolve: (value: AxiosResponse) => void
  reject: (error: AxiosError) => void
  timestamp: number
}

let requestQueue: QueuedRequest[] = []
let isOffline = false

// Base URL from environment variable
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

// Enhanced retry configuration with exponential backoff
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // Base delay in ms
  maxDelay: 10000, // Maximum delay in ms
  backoffFactor: 2, // Exponential backoff multiplier
  jitterMax: 1000, // Maximum jitter in ms
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableNetworkErrors: ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT']
}

// Create instance
export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // 30 second timeout
})

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Check if we should skip auth (only in development with explicit flag)
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV
    
    console.log('🔧 API Request Debug:', {
      skipAuth,
      isDev: import.meta.env.DEV,
      skipAuthEnv: import.meta.env.VITE_SKIP_AUTH,
      url: config.url,
      mode: import.meta.env.MODE
    })

    if (!skipAuth) {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔑 Adding auth header:', `Bearer ${token.substring(0, 20)}...`)
      }
    } else {
      console.log('⏭️ Skipping auth in development mode')
      // Ensure no auth header is sent and add dev bypass header
      if (config.headers && config.headers.Authorization) {
        delete config.headers.Authorization
      }
      // Add a development bypass header
      config.headers = config.headers || {}
      config.headers['X-Dev-Mode'] = 'true'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and retries
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number; _skipQueue?: boolean }

    // Handle offline requests - queue them for later
    if (!navigator.onLine && !originalRequest._skipQueue) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        requestQueue.push({
          config: originalRequest,
          resolve,
          reject,
          timestamp: Date.now()
        })
        
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'info',
          message: 'Request queued. Will retry when connection is restored.',
          duration: 3000
        })
      })
    }

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV

      if (!skipAuth) {
        const authStore = useAuthStore.getState()
        authStore.logout()

        // Show toast notification
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'error',
          message: 'Session expired. Please log in again.',
          duration: 5000
        })

        // Redirect to login
        window.location.href = '/login'
        return Promise.reject(error)
      } else {
        // In development with auth skipped, just log the error and continue
        console.warn('🚫 Auth error in development mode (ignoring):', {
          status: error.response?.status,
          message: (error.response?.data as any)?.message,
          url: error.config?.url
        })
        
        // Return a mock successful response for development based on the endpoint
        let mockData: any = { message: 'Development mode: Auth bypassed' }
        
        if (error.config?.url?.includes('/projects')) {
          mockData = {
            projects: [
              {
                _id: 'dev-project-1',
                id: 'dev-project-1',
                name: 'Development Test Project',
                description: 'A test project for development mode',
                idea: 'Testing the UI functionality without backend authentication',
                userId: 'dev-user',
                status: 'planned',
                currentStage: 'planning',
                stageResults: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                owner: 'Developer'
              }
            ]
          }
        }
        
        return Promise.resolve({
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config || {}
        } as AxiosResponse)
      }
    }

    // Handle network errors and retryable status codes
    if (shouldRetry(error) && !originalRequest._retry) {
      originalRequest._retry = true
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1

      if (originalRequest._retryCount <= RETRY_CONFIG.maxRetries) {
        const delay = calculateRetryDelay(originalRequest._retryCount)

        // Show retry notification for user awareness
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'warning',
          message: `Request failed. Retrying... (${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries})`,
          duration: 2000
        })

        await new Promise(resolve => setTimeout(resolve, delay))
        return apiClient(originalRequest)
      }
    }

    // Attempt error recovery before final error handling
    const recovered = await errorRecoveryService.attemptRecovery(error, {
      operation: originalRequest.url,
      retryCount: originalRequest._retryCount || 0,
      maxRetries: RETRY_CONFIG.maxRetries
    })

    if (recovered && originalRequest) {
      // Recovery successful, retry the request
      return apiClient(originalRequest)
    }

    // Handle final error after retries and recovery exhausted
    handleApiError(error)
    return Promise.reject(error)
  }
)

// Helper function to determine if request should be retried
function shouldRetry(error: AxiosError): boolean {
  // Network errors
  if (!error.response && error.code) {
    return RETRY_CONFIG.retryableNetworkErrors.includes(error.code)
  }

  // HTTP status codes
  if (error.response?.status) {
    return RETRY_CONFIG.retryableStatusCodes.includes(error.response.status)
  }

  return false
}

// Calculate exponential backoff delay with jitter
function calculateRetryDelay(retryCount: number): number {
  const { baseDelay, maxDelay, backoffFactor, jitterMax } = RETRY_CONFIG
  
  // Exponential backoff: baseDelay * (backoffFactor ^ (retryCount - 1))
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, retryCount - 1)
  
  // Add jitter to prevent thundering herd problem
  const jitter = Math.random() * jitterMax
  
  // Cap at maximum delay
  return Math.min(exponentialDelay + jitter, maxDelay)
}

// Enhanced error handling with offline support and recovery suggestions
function handleApiError(error: AxiosError) {
  const uiStore = useUIStore.getState()
  let message = 'An unexpected error occurred'
  let actions: Array<{ label: string; onClick: () => void }> = []

  if (!error.response) {
    // Network error - check if we're offline
    const isNetworkError = !navigator.onLine || 
      ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code || '')
    
    if (isNetworkError) {
      isOffline = true
      
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Check your connection and try again.'
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        message = 'Cannot reach server. Check your internet connection.'
      } else if (!navigator.onLine) {
        message = 'You are offline. Requests will be queued until connection is restored.'
        return // Don't show toast for offline state
      } else {
        message = 'Network error. Please check your connection.'
      }
      
      // Add retry action for network errors
      actions.push({
        label: 'Retry',
        onClick: () => {
          if (error.config) {
            apiClient(error.config).catch(() => {
              // Retry failed, show another error
            })
          }
        }
      })
    }
  } else {
    // HTTP error
    const status = error.response.status
    const data = error.response.data as any

    switch (status) {
      case 400:
        message = data?.message || 'Invalid request. Please check your input.'
        if (data?.errors && Array.isArray(data.errors)) {
          message += ` Issues: ${data.errors.join(', ')}`
        }
        break
      case 403:
        const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV
        if (skipAuth) {
          return // Don't show error toast in development mode for auth errors
        } else {
          message = 'Access denied. You may need to log in again.'
          actions.push({
            label: 'Login',
            onClick: () => window.location.href = '/login'
          })
        }
        break
      case 404:
        message = 'Resource not found. It may have been moved or deleted.'
        break
      case 409:
        message = data?.message || 'Conflict. The resource already exists or is in use.'
        break
      case 422:
        message = data?.message || 'Validation error. Please check your input.'
        if (data?.errors) {
          const errorDetails = Object.entries(data.errors)
            .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
            .join('; ')
          message += ` Details: ${errorDetails}`
        }
        break
      case 429:
        message = 'Rate limit exceeded. Please wait before trying again.'
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          message += ` Try again in ${retryAfter} seconds.`
        }
        break
      case 500:
        message = 'Server error. Our team has been notified.'
        actions.push({
          label: 'Retry',
          onClick: () => {
            if (error.config) {
              apiClient(error.config)
            }
          }
        })
        break
      case 502:
      case 503:
      case 504:
        message = 'Service temporarily unavailable. Please try again in a few moments.'
        actions.push({
          label: 'Retry',
          onClick: () => {
            setTimeout(() => {
              if (error.config) {
                apiClient(error.config)
              }
            }, 5000) // Retry after 5 seconds
          }
        })
        break
      default:
        message = data?.message || `Request failed (${status}). Please try again.`
    }
  }

  // Show error toast with actions
  uiStore.addToast({
    type: 'error',
    message,
    duration: actions.length > 0 ? 10000 : 7000, // Longer duration if there are actions
    actions
  })
}

// Process queued requests when back online
function processRequestQueue() {
  if (requestQueue.length === 0) return
  
  const uiStore = useUIStore.getState()
  uiStore.addToast({
    type: 'info',
    message: `Processing ${requestQueue.length} queued requests...`,
    duration: 3000
  })

  const queue = [...requestQueue]
  requestQueue = []

  queue.forEach(async ({ config, resolve, reject, timestamp }) => {
    // Skip requests older than 5 minutes
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      reject(new Error('Request expired') as any)
      return
    }

    try {
      const response = await apiClient(config)
      resolve(response)
    } catch (error) {
      reject(error as AxiosError)
    }
  })
}

// Listen for online/offline events
window.addEventListener('online', () => {
  if (isOffline) {
    isOffline = false
    const uiStore = useUIStore.getState()
    uiStore.addToast({
      type: 'success',
      message: 'Connection restored. Processing queued requests...',
      duration: 3000
    })
    processRequestQueue()
  }
})

window.addEventListener('offline', () => {
  isOffline = true
  const uiStore = useUIStore.getState()
  uiStore.addToast({
    type: 'warning',
    message: 'You are offline. Requests will be queued.',
    duration: 5000
  })
})

// Utility functions for common API patterns
export const apiUtils = {
  // Check if error is a network error
  isNetworkError: (error: AxiosError): boolean => {
    return !error.response && !!error.code
  },

  // Check if error is a server error (5xx)
  isServerError: (error: AxiosError): boolean => {
    return error.response ? error.response.status >= 500 : false
  },

  // Check if error is a client error (4xx)
  isClientError: (error: AxiosError): boolean => {
    const status = error.response?.status
    return status ? status >= 400 && status < 500 : false
  },

  // Extract error message from response
  getErrorMessage: (error: AxiosError): string => {
    const data = error.response?.data as any
    return data?.message || error.message || 'An error occurred'
  },

  // Create request with custom retry config
  createRetryableRequest: (config: AxiosRequestConfig, maxRetries?: number) => {
    const requestConfig = {
      ...config,
      metadata: {
        maxRetries: maxRetries || RETRY_CONFIG.maxRetries
      }
    }
    return apiClient(requestConfig)
  }
}

// Export types for use in components
export type { AxiosError, AxiosResponse }
