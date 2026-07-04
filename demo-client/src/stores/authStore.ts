// authStore.ts
// -----------
// Authentication state management

import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearError: () => void
  clearInvalidToken: () => void
  resetAuthState: () => void
}

// Helper function to validate token format
const isValidTokenFormat = (token: string | null): boolean => {
  if (!token) return false
  // Check if it's a proper JWT format (3 parts separated by dots)
  const parts = token.split('.')
  return parts.length === 3
}

// Get token from localStorage and validate it
const storedToken = localStorage.getItem('auth_token')
const validToken = isValidTokenFormat(storedToken) ? storedToken : null

// If token is invalid, remove it from localStorage
if (storedToken && !validToken) {
  localStorage.removeItem('auth_token')
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: validToken,
  isAuthenticated: !!validToken,
  loading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    
    try {
      // Check if we should use mock data (only in dev mode with skip auth)
      const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV
      
      if (skipAuth) {
        // Create a proper mock JWT token for development
        // This is a valid JWT structure but with mock data
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(JSON.stringify({
          id: '1',
          email,
          name: 'Test User',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }))
        const signature = btoa('mock-signature-for-development')
        const mockToken = `${header}.${payload}.${signature}`
        
        const mockUser: User = {
          id: '1',
          email,
          name: 'Test User'
        }
        
        localStorage.setItem('auth_token', mockToken)
        
        set({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          loading: false
        })
      } else {
        // Make actual API call for authentication
        const { apiClient } = await import('../services/api')
        
        const response = await apiClient.post('/auth/login', {
          email,
          password
        })
        
        const { token, user } = response.data
        
        if (!token || !user) {
          throw new Error('Invalid response from server')
        }
        
        localStorage.setItem('auth_token', token)
        
        set({
          user,
          token,
          isAuthenticated: true,
          loading: false
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      set({
        loading: false,
        error: errorMessage
      })
      throw error
    }
  },
  
  signup: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null })
    
    try {
      // Check if we should use mock data (only in dev mode with skip auth)
      const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV
      
      if (skipAuth) {
        // Create a proper mock JWT token for development
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(JSON.stringify({
          id: '1',
          email,
          name,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }))
        const signature = btoa('mock-signature-for-development')
        const mockToken = `${header}.${payload}.${signature}`
        
        const mockUser: User = {
          id: '1',
          email,
          name
        }
        
        localStorage.setItem('auth_token', mockToken)
        
        set({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          loading: false
        })
      } else {
        // Make actual API call for signup
        const { apiClient } = await import('../services/api')
        
        const response = await apiClient.post('/auth/signup', {
          email,
          password,
          name
        })
        
        const { token, user } = response.data
        
        if (!token || !user) {
          throw new Error('Invalid response from server')
        }
        
        localStorage.setItem('auth_token', token)
        
        set({
          user,
          token,
          isAuthenticated: true,
          loading: false
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed'
      set({
        loading: false,
        error: errorMessage
      })
      throw error
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    })
  },
  
  setUser: (user: User) => {
    set({ user })
  },
  
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token)
    set({ token, isAuthenticated: true })
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  // Utility function to clear invalid tokens
  clearInvalidToken: () => {
    const token = localStorage.getItem('auth_token')
    if (token && !isValidTokenFormat(token)) {
      localStorage.removeItem('auth_token')
      set({
        token: null,
        isAuthenticated: false,
        user: null
      })
    }
  },
  
  // Development utility to reset auth state completely
  resetAuthState: () => {
    localStorage.removeItem('auth_token')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    })
  },
  
  // Restore user session from stored token
  restoreSession: async () => {
    const token = localStorage.getItem('auth_token')
    
    if (!token || !isValidTokenFormat(token)) {
      return
    }
    
    set({ loading: true })
    
    try {
      // Skip API call in development mode with auth skipped
      const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV
      
      if (skipAuth) {
        // Decode mock token to get user info
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const mockUser: User = {
            id: payload.id,
            email: payload.email,
            name: payload.name
          }
          
          set({
            user: mockUser,
            token,
            isAuthenticated: true,
            loading: false
          })
        } catch {
          // Invalid token format, clear it
          localStorage.removeItem('auth_token')
          set({
            token: null,
            isAuthenticated: false,
            loading: false
          })
        }
      } else {
        // Verify token with backend
        const { apiClient } = await import('../services/api')
        
        const response = await apiClient.get('/auth/me')
        const user = response.data.user
        
        set({
          user,
          token,
          isAuthenticated: true,
          loading: false
        })
      }
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token')
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      })
    }
  }
}))

export default useAuthStore

// Development helper - expose auth store to window for debugging
if (import.meta.env.DEV) {
  (window as any).authStore = useAuthStore
  console.log('🔧 Development mode: authStore available on window.authStore')
}