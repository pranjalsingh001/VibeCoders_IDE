// errorRecovery.ts
// ----------------
// Centralized error recovery service with intelligent retry strategies
// Handles different types of errors with appropriate recovery mechanisms

import { AxiosError } from 'axios'
import useUIStore from '../stores/uiStore'
import useAuthStore from '../stores/authStore'

export interface RecoveryStrategy {
  canRecover: (error: Error | AxiosError) => boolean
  recover: (error: Error | AxiosError, context?: any) => Promise<boolean>
  getRecoveryMessage: (error: Error | AxiosError) => string
  priority: number // Higher priority strategies are tried first
}

export interface RecoveryContext {
  operation?: string
  retryCount?: number
  maxRetries?: number
  userAction?: boolean
  metadata?: Record<string, any>
}

class ErrorRecoveryService {
  private strategies: RecoveryStrategy[] = []
  private recoveryHistory: Map<string, number> = new Map()

  constructor() {
    this.registerDefaultStrategies()
  }

  // Register a recovery strategy
  registerStrategy(strategy: RecoveryStrategy) {
    this.strategies.push(strategy)
    this.strategies.sort((a, b) => b.priority - a.priority)
  }

  // Attempt to recover from an error
  async attemptRecovery(
    error: Error | AxiosError, 
    context: RecoveryContext = {}
  ): Promise<boolean> {
    const errorKey = this.getErrorKey(error)
    const previousAttempts = this.recoveryHistory.get(errorKey) || 0
    
    // Prevent infinite recovery loops
    if (previousAttempts >= (context.maxRetries || 3)) {
      console.warn('Max recovery attempts reached for error:', errorKey)
      return false
    }

    // Find applicable recovery strategies
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.canRecover(error)
    )

    if (applicableStrategies.length === 0) {
      console.warn('No recovery strategy found for error:', error.message)
      return false
    }

    // Try each strategy in priority order
    for (const strategy of applicableStrategies) {
      try {
        console.log(`Attempting recovery with strategy: ${strategy.constructor.name}`)
        
        const recovered = await strategy.recover(error, context)
        
        if (recovered) {
          console.log('Recovery successful')
          this.recoveryHistory.delete(errorKey) // Reset on success
          
          // Show success message
          const uiStore = useUIStore.getState()
          uiStore.addToast({
            type: 'success',
            message: 'Issue resolved automatically',
            duration: 3000
          })
          
          return true
        }
      } catch (recoveryError) {
        console.error('Recovery strategy failed:', recoveryError)
      }
    }

    // Update recovery history
    this.recoveryHistory.set(errorKey, previousAttempts + 1)
    
    // Show recovery suggestions to user
    this.showRecoverySuggestions(error, applicableStrategies)
    
    return false
  }

  // Get a unique key for error tracking
  private getErrorKey(error: Error | AxiosError): string {
    if ('response' in error && error.response) {
      return `${error.response.status}-${error.config?.url || 'unknown'}`
    }
    return `${error.name}-${error.message.substring(0, 50)}`
  }

  // Show recovery suggestions to the user
  private showRecoverySuggestions(error: Error | AxiosError, strategies: RecoveryStrategy[]) {
    const uiStore = useUIStore.getState()
    const suggestions = strategies.map(s => s.getRecoveryMessage(error))
    
    uiStore.addToast({
      type: 'warning',
      message: 'Automatic recovery failed. Try these solutions:',
      duration: 10000,
      actions: suggestions.slice(0, 2).map((suggestion, index) => ({
        label: `Try ${index + 1}`,
        onClick: () => {
          strategies[index].recover(error).catch(console.error)
        }
      }))
    })
  }

  // Register default recovery strategies
  private registerDefaultStrategies() {
    // Network connectivity recovery
    this.registerStrategy({
      canRecover: (error) => {
        return 'code' in error && 
          ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code || '')
      },
      recover: async () => {
        // Wait for network to be available
        if (!navigator.onLine) {
          return new Promise((resolve) => {
            const checkOnline = () => {
              if (navigator.onLine) {
                window.removeEventListener('online', checkOnline)
                resolve(true)
              }
            }
            window.addEventListener('online', checkOnline)
            
            // Timeout after 30 seconds
            setTimeout(() => {
              window.removeEventListener('online', checkOnline)
              resolve(false)
            }, 30000)
          })
        }
        
        // Test connectivity
        try {
          await fetch('/api/v1/health', { method: 'HEAD' })
          return true
        } catch {
          return false
        }
      },
      getRecoveryMessage: () => 'Check your internet connection',
      priority: 10
    })

    // Authentication recovery
    this.registerStrategy({
      canRecover: (error) => {
        return 'response' in error && error.response?.status === 401
      },
      recover: async () => {
        const authStore = useAuthStore.getState()
        
        // Try to refresh token if available
        if (authStore.refreshToken) {
          try {
            await authStore.refreshAccessToken()
            return true
          } catch {
            // Refresh failed, redirect to login
            authStore.logout()
            window.location.href = '/login'
            return false
          }
        }
        
        return false
      },
      getRecoveryMessage: () => 'Re-authenticate your session',
      priority: 9
    })

    // Server error recovery (5xx)
    this.registerStrategy({
      canRecover: (error) => {
        return 'response' in error && 
          error.response?.status !== undefined &&
          error.response.status >= 500
      },
      recover: async (error, context) => {
        // Exponential backoff retry
        const retryCount = context?.retryCount || 0
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Test if server is back up
        try {
          await fetch('/api/v1/health', { method: 'HEAD' })
          return true
        } catch {
          return false
        }
      },
      getRecoveryMessage: () => 'Wait for server to recover',
      priority: 7
    })

    // Rate limiting recovery
    this.registerStrategy({
      canRecover: (error) => {
        return 'response' in error && error.response?.status === 429
      },
      recover: async (error) => {
        // Check for Retry-After header
        const retryAfter = 'response' in error ? 
          error.response?.headers['retry-after'] : null
        
        const delay = retryAfter ? 
          parseInt(retryAfter) * 1000 : 
          5000 // Default 5 second delay
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return true
      },
      getRecoveryMessage: (error) => {
        const retryAfter = 'response' in error ? 
          error.response?.headers['retry-after'] : null
        return retryAfter ? 
          `Wait ${retryAfter} seconds before retrying` : 
          'Wait a moment before retrying'
      },
      priority: 8
    })

    // Validation error recovery
    this.registerStrategy({
      canRecover: (error) => {
        return 'response' in error && 
          [400, 422].includes(error.response?.status || 0)
      },
      recover: async () => {
        // Can't automatically recover from validation errors
        // But we can provide better user guidance
        return false
      },
      getRecoveryMessage: (error) => {
        const data = 'response' in error ? error.response?.data as any : null
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0]
          return `Fix validation error: ${firstError}`
        }
        return 'Check your input and try again'
      },
      priority: 5
    })

    // Generic retry strategy
    this.registerStrategy({
      canRecover: () => true, // Can attempt for any error
      recover: async (error, context) => {
        const retryCount = context?.retryCount || 0
        if (retryCount >= 2) return false // Max 2 generic retries
        
        // Simple delay and retry
        await new Promise(resolve => setTimeout(resolve, 2000))
        return false // Let the caller handle the actual retry
      },
      getRecoveryMessage: () => 'Try the operation again',
      priority: 1 // Lowest priority
    })
  }

  // Clear recovery history (useful for testing or manual reset)
  clearHistory() {
    this.recoveryHistory.clear()
  }

  // Get recovery statistics
  getRecoveryStats() {
    return {
      totalErrors: this.recoveryHistory.size,
      errorHistory: Array.from(this.recoveryHistory.entries())
    }
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService()

// Utility functions for common error recovery patterns
export const recoveryUtils = {
  // Check if error is recoverable
  isRecoverable: (error: Error | AxiosError): boolean => {
    // Network errors are usually recoverable
    if ('code' in error && error.code) return true
    
    // Some HTTP errors are recoverable
    if ('response' in error && error.response) {
      const status = error.response.status
      return [408, 429, 500, 502, 503, 504].includes(status)
    }
    
    return false
  },

  // Get user-friendly error category
  getErrorCategory: (error: Error | AxiosError): string => {
    if (!navigator.onLine) return 'offline'
    
    if ('response' in error && error.response) {
      const status = error.response.status
      if (status === 401 || status === 403) return 'authentication'
      if (status === 429) return 'rate-limit'
      if (status >= 500) return 'server-error'
      if (status >= 400) return 'client-error'
    }
    
    if ('code' in error) {
      if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code || '')) {
        return 'network'
      }
    }
    
    return 'unknown'
  },

  // Get recovery time estimate
  getRecoveryTimeEstimate: (error: Error | AxiosError): string => {
    const category = recoveryUtils.getErrorCategory(error)
    
    switch (category) {
      case 'network':
        return 'Usually resolves within 1-2 minutes'
      case 'server-error':
        return 'May take 5-10 minutes to resolve'
      case 'rate-limit':
        return 'Should resolve within 1 minute'
      case 'authentication':
        return 'Requires immediate action'
      default:
        return 'Resolution time varies'
    }
  }
}

export default errorRecoveryService