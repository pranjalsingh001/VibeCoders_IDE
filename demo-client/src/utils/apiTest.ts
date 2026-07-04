// API Testing Utility for Development
// Use this to test API endpoints and debug issues

import { apiClient } from '../services/api'

export const apiTest = {
  // Test basic connectivity
  testHealth: async () => {
    try {
      const response = await apiClient.get('/health')
      console.log('✅ Health check:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Health check failed:', error.response?.data || error.message)
      throw error
    }
  },

  // Test projects endpoint
  testProjects: async () => {
    try {
      const response = await apiClient.get('/projects')
      console.log('✅ Projects:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Projects failed:', error.response?.data || error.message)
      throw error
    }
  },

  // Test workflow status endpoint
  testWorkflowStatus: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/workflow/status`)
      console.log('✅ Workflow status:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Workflow status failed:', error.response?.data || error.message)
      throw error
    }
  },

  // Test all endpoints
  testAll: async (projectId?: string) => {
    console.log('🧪 Starting API tests...')
    
    try {
      await apiTest.testHealth()
      await apiTest.testProjects()
      
      if (projectId) {
        await apiTest.testWorkflowStatus(projectId)
      }
      
      console.log('✅ All API tests passed!')
    } catch (error) {
      console.error('❌ API tests failed:', error)
    }
  },

  // Debug current environment
  debugEnv: () => {
    console.log('🔧 Environment Debug:', {
      baseURL: import.meta.env.VITE_API_BASE_URL,
      skipAuth: import.meta.env.VITE_SKIP_AUTH,
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE
    })
  }
}

// Expose to window in development
if (import.meta.env.DEV) {
  (window as any).apiTest = apiTest
  console.log('🧪 API test utilities available on window.apiTest')
}