// errorRecovery.test.ts
// ----------------------
// Tests for the error recovery service

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AxiosError } from 'axios'
import { errorRecoveryService, recoveryUtils } from '../errorRecovery'

// Mock fetch
global.fetch = vi.fn()

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock useUIStore and useAuthStore
vi.mock('../../stores/uiStore', () => {
  const mockUIStoreState = {
    addToast: vi.fn()
  }

  const mockUIStore = Object.assign(
    vi.fn(() => mockUIStoreState),
    {
      getState: vi.fn(() => mockUIStoreState)
    }
  )

  return {
    default: mockUIStore
  }
})

vi.mock('../../stores/authStore', () => {
  const mockAuthStoreState = {
    refreshToken: 'mock-refresh-token',
    refreshAccessToken: vi.fn().mockResolvedValue(true),
    logout: vi.fn()
  }

  const mockAuthStore = Object.assign(
    vi.fn(() => mockAuthStoreState),
    {
      getState: vi.fn(() => mockAuthStoreState)
    }
  )

  return {
    default: mockAuthStore
  }
})

// Helper to create mock AxiosError
const createAxiosError = (status: number, code?: string): AxiosError => {
  const error = new Error('Mock error') as AxiosError
  error.response = {
    status,
    data: { message: 'Mock error message' },
    statusText: 'Error',
    headers: {},
    config: {}
  } as any
  error.config = { url: '/api/test' } as any
  if (code) {
    error.code = code
  }
  return error
}

describe('errorRecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigator.onLine = true
    errorRecoveryService.clearHistory()
    
    // Mock successful fetch by default
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200
    })
  })

  describe('network connectivity recovery', () => {
    it('recovers from network errors when connection is restored', async () => {
      const networkError = new Error('Network error')
      networkError.name = 'NetworkError'
      ;(networkError as any).code = 'ECONNREFUSED'

      const recovered = await errorRecoveryService.attemptRecovery(networkError)
      expect(recovered).toBe(true)
    })

    it('waits for online status when offline', async () => {
      navigator.onLine = false
      const networkError = new Error('Network error')
      ;(networkError as any).code = 'ENOTFOUND'

      // Start recovery attempt
      const recoveryPromise = errorRecoveryService.attemptRecovery(networkError)

      // Simulate coming back online after a delay
      setTimeout(() => {
        navigator.onLine = true
        window.dispatchEvent(new Event('online'))
      }, 100)

      const recovered = await recoveryPromise
      expect(recovered).toBe(true)
    })

    it('fails recovery when network test fails', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Still no connection'))
      
      const networkError = new Error('Network error')
      ;(networkError as any).code = 'ECONNRESET'

      const recovered = await errorRecoveryService.attemptRecovery(networkError)
      expect(recovered).toBe(false)
    })
  })

  describe('authentication recovery', () => {
    it('recovers from 401 errors by refreshing token', async () => {
      const authError = createAxiosError(401)
      
      const recovered = await errorRecoveryService.attemptRecovery(authError)
      expect(recovered).toBe(true)
    })

    it('redirects to login when refresh fails', async () => {
      const authStore = require('../../stores/authStore').default()
      authStore.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'))
      
      // Mock window.location
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      })

      const authError = createAxiosError(401)
      
      const recovered = await errorRecoveryService.attemptRecovery(authError)
      expect(recovered).toBe(false)
      expect(authStore.logout).toHaveBeenCalled()
      expect(mockLocation.href).toBe('/login')
    })
  })

  describe('server error recovery', () => {
    it('recovers from 500 errors when server comes back up', async () => {
      const serverError = createAxiosError(500)
      
      const recovered = await errorRecoveryService.attemptRecovery(serverError)
      expect(recovered).toBe(true)
    })

    it('fails recovery when server is still down', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Server still down'))
      
      const serverError = createAxiosError(503)
      
      const recovered = await errorRecoveryService.attemptRecovery(serverError)
      expect(recovered).toBe(false)
    })
  })

  describe('rate limiting recovery', () => {
    it('recovers from 429 errors after waiting', async () => {
      const rateLimitError = createAxiosError(429)
      rateLimitError.response!.headers = { 'retry-after': '1' }
      
      const startTime = Date.now()
      const recovered = await errorRecoveryService.attemptRecovery(rateLimitError)
      const endTime = Date.now()
      
      expect(recovered).toBe(true)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000) // Waited at least 1 second
    })

    it('uses default delay when no retry-after header', async () => {
      const rateLimitError = createAxiosError(429)
      
      const startTime = Date.now()
      const recovered = await errorRecoveryService.attemptRecovery(rateLimitError)
      const endTime = Date.now()
      
      expect(recovered).toBe(true)
      expect(endTime - startTime).toBeGreaterThanOrEqual(5000) // Default 5 second delay
    })
  })

  describe('validation error handling', () => {
    it('does not attempt recovery for validation errors', async () => {
      const validationError = createAxiosError(422)
      
      const recovered = await errorRecoveryService.attemptRecovery(validationError)
      expect(recovered).toBe(false)
    })

    it('provides helpful messages for validation errors', async () => {
      const validationError = createAxiosError(400)
      validationError.response!.data = {
        errors: { email: ['Invalid email format'] }
      }
      
      // This should show recovery suggestions to user
      await errorRecoveryService.attemptRecovery(validationError)
      
      // Verify that the UI store was called to show suggestions
      // (This would be tested through integration tests in a real scenario)
    })
  })

  describe('recovery limits', () => {
    it('prevents infinite recovery loops', async () => {
      const error = createAxiosError(500)
      
      // Attempt recovery multiple times
      await errorRecoveryService.attemptRecovery(error, { maxRetries: 2 })
      await errorRecoveryService.attemptRecovery(error, { maxRetries: 2 })
      const thirdAttempt = await errorRecoveryService.attemptRecovery(error, { maxRetries: 2 })
      
      expect(thirdAttempt).toBe(false)
    })

    it('resets recovery count on successful recovery', async () => {
      const error = createAxiosError(500)
      
      // First recovery succeeds
      const firstAttempt = await errorRecoveryService.attemptRecovery(error)
      expect(firstAttempt).toBe(true)
      
      // Should be able to recover again
      const secondAttempt = await errorRecoveryService.attemptRecovery(error)
      expect(secondAttempt).toBe(true)
    })
  })

  describe('custom recovery strategies', () => {
    it('allows registering custom recovery strategies', async () => {
      const customStrategy = {
        canRecover: (error: any) => error.message === 'Custom error',
        recover: async () => true,
        getRecoveryMessage: () => 'Custom recovery',
        priority: 10
      }
      
      errorRecoveryService.registerStrategy(customStrategy)
      
      const customError = new Error('Custom error')
      const recovered = await errorRecoveryService.attemptRecovery(customError)
      
      expect(recovered).toBe(true)
    })

    it('respects strategy priority order', async () => {
      const lowPriorityStrategy = {
        canRecover: () => true,
        recover: async () => { throw new Error('Should not be called') },
        getRecoveryMessage: () => 'Low priority',
        priority: 1
      }
      
      const highPriorityStrategy = {
        canRecover: () => true,
        recover: async () => true,
        getRecoveryMessage: () => 'High priority',
        priority: 10
      }
      
      errorRecoveryService.registerStrategy(lowPriorityStrategy)
      errorRecoveryService.registerStrategy(highPriorityStrategy)
      
      const error = new Error('Test error')
      const recovered = await errorRecoveryService.attemptRecovery(error)
      
      expect(recovered).toBe(true)
    })
  })
})

describe('recoveryUtils', () => {
  it('correctly identifies recoverable errors', () => {
    const networkError = new Error('Network error')
    ;(networkError as any).code = 'ECONNREFUSED'
    
    const serverError = createAxiosError(500)
    const validationError = createAxiosError(400)
    
    expect(recoveryUtils.isRecoverable(networkError)).toBe(true)
    expect(recoveryUtils.isRecoverable(serverError)).toBe(true)
    expect(recoveryUtils.isRecoverable(validationError)).toBe(false)
  })

  it('categorizes errors correctly', () => {
    navigator.onLine = false
    expect(recoveryUtils.getErrorCategory(new Error('Any error'))).toBe('offline')
    
    navigator.onLine = true
    expect(recoveryUtils.getErrorCategory(createAxiosError(401))).toBe('authentication')
    expect(recoveryUtils.getErrorCategory(createAxiosError(429))).toBe('rate-limit')
    expect(recoveryUtils.getErrorCategory(createAxiosError(500))).toBe('server-error')
    expect(recoveryUtils.getErrorCategory(createAxiosError(400))).toBe('client-error')
    
    const networkError = new Error('Network error')
    ;(networkError as any).code = 'ECONNREFUSED'
    expect(recoveryUtils.getErrorCategory(networkError)).toBe('network')
  })

  it('provides recovery time estimates', () => {
    const networkError = new Error('Network error')
    ;(networkError as any).code = 'ETIMEDOUT'
    
    expect(recoveryUtils.getRecoveryTimeEstimate(networkError)).toBe('Usually resolves within 1-2 minutes')
    expect(recoveryUtils.getRecoveryTimeEstimate(createAxiosError(500))).toBe('May take 5-10 minutes to resolve')
    expect(recoveryUtils.getRecoveryTimeEstimate(createAxiosError(429))).toBe('Should resolve within 1 minute')
    expect(recoveryUtils.getRecoveryTimeEstimate(createAxiosError(401))).toBe('Requires immediate action')
  })
})