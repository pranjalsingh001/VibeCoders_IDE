// api.test.ts
// Unit tests for API service layer

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AxiosError } from 'axios'
import { apiUtils } from '../api'

// Mock stores
vi.mock('../../stores/authStore', () => ({
  default: {
    getState: vi.fn(() => ({
      token: 'mock-token',
      logout: vi.fn()
    }))
  }
}))

vi.mock('../../stores/uiStore', () => ({
  default: {
    getState: vi.fn(() => ({
      addToast: vi.fn()
    }))
  }
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5173',
    reload: vi.fn(),
  },
  writable: true,
})

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Note: Testing the actual API client creation and interceptors is complex
  // due to module-level initialization. Focus on testing the utility functions
  // which contain the core business logic.

  describe('API Utils', () => {
    describe('isNetworkError', () => {
      it('should identify network errors', () => {
        const networkError: AxiosError = {
          response: undefined,
          code: 'ECONNABORTED',
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Network Error'
        }

        expect(apiUtils.isNetworkError(networkError)).toBe(true)
      })

      it('should not identify HTTP errors as network errors', () => {
        const httpError: AxiosError = {
          response: {
            status: 404,
            data: {},
            statusText: 'Not Found',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Not Found'
        }

        expect(apiUtils.isNetworkError(httpError)).toBe(false)
      })
    })

    describe('isServerError', () => {
      it('should identify server errors (5xx)', () => {
        const serverError: AxiosError = {
          response: {
            status: 500,
            data: {},
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Server Error'
        }

        expect(apiUtils.isServerError(serverError)).toBe(true)
      })

      it('should not identify client errors as server errors', () => {
        const clientError: AxiosError = {
          response: {
            status: 400,
            data: {},
            statusText: 'Bad Request',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Bad Request'
        }

        expect(apiUtils.isServerError(clientError)).toBe(false)
      })
    })

    describe('isClientError', () => {
      it('should identify client errors (4xx)', () => {
        const clientError: AxiosError = {
          response: {
            status: 404,
            data: {},
            statusText: 'Not Found',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Not Found'
        }

        expect(apiUtils.isClientError(clientError)).toBe(true)
      })

      it('should not identify server errors as client errors', () => {
        const serverError: AxiosError = {
          response: {
            status: 500,
            data: {},
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Server Error'
        }

        expect(apiUtils.isClientError(serverError)).toBe(false)
      })
    })

    describe('getErrorMessage', () => {
      it('should extract message from response data', () => {
        const error: AxiosError = {
          response: {
            status: 400,
            data: { message: 'Custom error message' },
            statusText: 'Bad Request',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Request failed'
        }

        expect(apiUtils.getErrorMessage(error)).toBe('Custom error message')
      })

      it('should fallback to error message when no response data', () => {
        const error: AxiosError = {
          response: undefined,
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: 'Network Error'
        }

        expect(apiUtils.getErrorMessage(error)).toBe('Network Error')
      })

      it('should fallback to default message when no message available', () => {
        const error: AxiosError = {
          response: {
            status: 500,
            data: {},
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any
          },
          config: {} as any,
          isAxiosError: true,
          toJSON: () => ({}),
          name: 'AxiosError',
          message: ''
        }

        expect(apiUtils.getErrorMessage(error)).toBe('An error occurred')
      })
    })
  })
})