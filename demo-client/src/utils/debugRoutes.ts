// Debug utility to check available routes on the server
import { apiClient } from '../services/api'

export const debugRoutes = async () => {
  try {
    console.log('🔍 Checking server routes...')
    
    // Try the debug routes endpoint if it exists
    const response = await apiClient.get('/debug/routes')
    console.log('📋 Available routes:', response.data)
    return response.data
  } catch (error: any) {
    console.log('ℹ️ Debug routes endpoint not available')
    
    // Try some basic endpoints to see what's working
    const tests = [
      { name: 'Health Check', url: '/health' },
      { name: 'API Root', url: '/' },
      { name: 'Projects', url: '/projects' }
    ]
    
    for (const test of tests) {
      try {
        const response = await apiClient.get(test.url)
        console.log(`✅ ${test.name} (${test.url}):`, response.status)
      } catch (error: any) {
        console.log(`❌ ${test.name} (${test.url}):`, error.response?.status || 'Network Error')
      }
    }
  }
}

// Expose to window in development
if (import.meta.env.DEV) {
  (window as any).debugRoutes = debugRoutes
}