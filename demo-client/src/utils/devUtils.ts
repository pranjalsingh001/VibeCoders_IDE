// Development utilities for testing and debugging
// Only available in development mode

export const devUtils = {
  // Check if we're in development mode
  isDev: () => import.meta.env.DEV,
  
  // Check if auth is skipped
  isAuthSkipped: () => import.meta.env.VITE_SKIP_AUTH === 'true' || import.meta.env.DEV,
  
  // Log environment variables for debugging
  logEnvVars: () => {
    if (import.meta.env.DEV) {
      console.log('🔧 Environment Variables:', {
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_SKIP_AUTH: import.meta.env.VITE_SKIP_AUTH,
        VITE_DEV_MODE: import.meta.env.VITE_DEV_MODE
      })
    }
  },
  
  // Create a mock user session for testing
  createMockSession: () => {
    if (import.meta.env.DEV) {
      const mockUser = {
        id: 'dev-user-1',
        email: 'developer@test.com',
        name: 'Test Developer'
      }
      
      // Create a proper mock JWT token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({
        ...mockUser,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }))
      const signature = btoa('mock-signature-for-development')
      const mockToken = `${header}.${payload}.${signature}`
      
      localStorage.setItem('auth_token', mockToken)
      
      return { user: mockUser, token: mockToken }
    }
    return null
  },
  
  // Clear all auth data
  clearAuth: () => {
    if (import.meta.env.DEV) {
      localStorage.removeItem('auth_token')
      console.log('🧹 Cleared auth data')
    }
  }
}

// Expose to window in development
if (import.meta.env.DEV) {
  (window as any).devUtils = devUtils
  console.log('🔧 Development utilities available on window.devUtils')
  
  // Log environment on load
  devUtils.logEnvVars()
}