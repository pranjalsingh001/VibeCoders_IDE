// useErrorHandling.ts
// -------------------
// Comprehensive error handling hook for components
// Provides consistent error handling patterns across the application

import { useCallback, useState } from 'react'
import { AxiosError } from 'axios'
import useUIStore from '../stores/uiStore'
import { errorRecoveryService, recoveryUtils } from '../services/errorRecovery'
import { validateFieldWithFeedback, ValidationResult } from '../utils/validation'

export interface ErrorState {
  hasError: boolean
  error: Error | AxiosError | null
  errorMessage: string
  canRetry: boolean
  isRecovering: boolean
  retryCount: number
}

export interface UseErrorHandlingOptions {
  maxRetries?: number
  showToast?: boolean
  autoRecover?: boolean
  context?: string
}

export const useErrorHandling = (options: UseErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    showToast = true,
    autoRecover = true,
    context = 'operation'
  } = options

  const { addToast } = useUIStore()
  
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorMessage: '',
    canRetry: false,
    isRecovering: false,
    retryCount: 0
  })

  // Handle error with automatic recovery attempt
  const handleError = useCallback(async (
    error: Error | AxiosError,
    customMessage?: string
  ) => {
    console.error(`Error in ${context}:`, error)

    const errorMessage = customMessage || getErrorMessage(error)
    const canRetry = recoveryUtils.isRecoverable(error)

    setErrorState(prev => ({
      hasError: true,
      error,
      errorMessage,
      canRetry,
      isRecovering: false,
      retryCount: prev.retryCount + 1
    }))

    // Show toast notification if enabled
    if (showToast) {
      addToast({
        type: 'error',
        message: errorMessage,
        duration: 7000
      })
    }

    // Attempt automatic recovery if enabled
    if (autoRecover && canRetry && errorState.retryCount < maxRetries) {
      setErrorState(prev => ({ ...prev, isRecovering: true }))
      
      try {
        const recovered = await errorRecoveryService.attemptRecovery(error, {
          operation: context,
          retryCount: errorState.retryCount,
          maxRetries
        })

        if (recovered) {
          clearError()
          return true
        }
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError)
      } finally {
        setErrorState(prev => ({ ...prev, isRecovering: false }))
      }
    }

    return false
  }, [context, showToast, autoRecover, maxRetries, errorState.retryCount, addToast])

  // Manual retry function
  const retry = useCallback(async (retryFn?: () => Promise<void>) => {
    if (!errorState.canRetry) return false

    setErrorState(prev => ({ ...prev, isRecovering: true }))

    try {
      if (retryFn) {
        await retryFn()
      } else if (errorState.error) {
        const recovered = await errorRecoveryService.attemptRecovery(errorState.error, {
          operation: context,
          retryCount: errorState.retryCount,
          maxRetries,
          userAction: true
        })

        if (!recovered) {
          throw new Error('Recovery failed')
        }
      }

      clearError()
      
      if (showToast) {
        addToast({
          type: 'success',
          message: 'Operation completed successfully',
          duration: 3000
        })
      }

      return true
    } catch (error) {
      console.error('Retry failed:', error)
      
      if (showToast) {
        addToast({
          type: 'error',
          message: 'Retry failed. Please try again later.',
          duration: 5000
        })
      }

      return false
    } finally {
      setErrorState(prev => ({ ...prev, isRecovering: false }))
    }
  }, [errorState, context, maxRetries, showToast, addToast])

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorMessage: '',
      canRetry: false,
      isRecovering: false,
      retryCount: 0
    })
  }, [])

  // Validation error handling
  const handleValidationError = useCallback((
    fieldName: string,
    value: string,
    validation: any,
    fieldType?: string
  ): ValidationResult & { feedback?: string; severity?: 'error' | 'warning' | 'info' } => {
    const result = validateFieldWithFeedback(value, validation, fieldType)
    
    if (!result.isValid && result.error) {
      // Don't set global error state for validation errors
      // Just return the validation result for component to handle
      return result
    }
    
    return result
  }, [])

  // Network error specific handling
  const handleNetworkError = useCallback(async (error: AxiosError) => {
    const category = recoveryUtils.getErrorCategory(error)
    const timeEstimate = recoveryUtils.getRecoveryTimeEstimate(error)
    
    let message = getErrorMessage(error)
    if (category === 'network') {
      message += ` (${timeEstimate})`
    }

    return handleError(error, message)
  }, [handleError])

  // Get user-friendly error message
  const getErrorMessage = (error: Error | AxiosError): string => {
    if ('response' in error && error.response) {
      const status = error.response.status
      const data = error.response.data as any

      switch (status) {
        case 400:
          return data?.message || 'Invalid request. Please check your input.'
        case 401:
          return 'Authentication required. Please log in.'
        case 403:
          return 'Access denied. You may not have permission for this action.'
        case 404:
          return 'Resource not found. It may have been moved or deleted.'
        case 409:
          return data?.message || 'Conflict. The resource already exists.'
        case 422:
          return data?.message || 'Validation failed. Please check your input.'
        case 429:
          return 'Too many requests. Please wait before trying again.'
        case 500:
          return 'Server error. Please try again later.'
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again.'
        default:
          return data?.message || `Request failed (${status})`
      }
    }

    if ('code' in error && error.code) {
      switch (error.code) {
        case 'ECONNABORTED':
          return 'Request timed out. Please check your connection.'
        case 'ENOTFOUND':
        case 'ECONNREFUSED':
          return 'Cannot connect to server. Please check your connection.'
        case 'ETIMEDOUT':
          return 'Connection timed out. Please try again.'
        default:
          return 'Network error. Please check your connection.'
      }
    }

    return error.message || 'An unexpected error occurred'
  }

  return {
    errorState,
    handleError,
    handleNetworkError,
    handleValidationError,
    retry,
    clearError,
    
    // Convenience getters
    hasError: errorState.hasError,
    isRecovering: errorState.isRecovering,
    canRetry: errorState.canRetry,
    errorMessage: errorState.errorMessage,
    retryCount: errorState.retryCount
  }
}

// Specialized hooks for common error scenarios
export const useNetworkErrorHandling = () => {
  return useErrorHandling({
    context: 'network-operation',
    autoRecover: true,
    maxRetries: 3
  })
}

export const useValidationErrorHandling = () => {
  return useErrorHandling({
    context: 'validation',
    showToast: false, // Validation errors are usually shown inline
    autoRecover: false
  })
}

export const useAPIErrorHandling = (operationName: string) => {
  return useErrorHandling({
    context: operationName,
    autoRecover: true,
    maxRetries: 2
  })
}

export default useErrorHandling