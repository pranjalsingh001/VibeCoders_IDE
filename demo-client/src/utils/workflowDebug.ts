// Workflow debugging utilities
import { apiClient } from '../services/api'

export const workflowDebug = {
  // Get workflow status and log all data
  debugWorkflowStatus: async (projectId: string) => {
    try {
      console.log('🔍 Debugging workflow status for project:', projectId)
      
      const response = await apiClient.get(`/projects/${projectId}/workflow/status`)
      console.log('📋 Raw server response:', response.data)
      
      const workflowData = response.data.workflow || {}
      console.log('🔧 Workflow data:', workflowData)
      
      if (workflowData.results) {
        console.log('📊 Results breakdown:')
        console.log('  - Planning:', workflowData.results.planning)
        console.log('  - Blueprint:', workflowData.results.blueprint)
        console.log('  - HLD:', workflowData.results.hld)
        console.log('  - LLD:', workflowData.results.lld)
      }
      
      return workflowData
    } catch (error: any) {
      console.error('❌ Failed to debug workflow status:', error.response?.data || error.message)
      throw error
    }
  },

  // Check what's in the LLD content
  debugLLD: async (projectId: string) => {
    try {
      const workflowData = await workflowDebug.debugWorkflowStatus(projectId)
      const lld = workflowData.results?.lld
      
      if (lld) {
        console.log('📝 LLD Content Analysis:')
        console.log('  - Type:', typeof lld)
        console.log('  - Length:', typeof lld === 'string' ? lld.length : 'N/A')
        
        if (typeof lld === 'string') {
          console.log('  - First 500 chars:', lld.substring(0, 500))
          
          // Check if it contains project-specific terms
          const projectSpecificTerms = ['tweet', 'twitter', 'social', 'post', 'follow']
          const foundTerms = projectSpecificTerms.filter(term => 
            lld.toLowerCase().includes(term.toLowerCase())
          )
          
          if (foundTerms.length > 0) {
            console.warn('⚠️ LLD contains generic social media terms:', foundTerms)
          } else {
            console.log('✅ LLD appears to be project-specific')
          }
        } else if (typeof lld === 'object') {
          console.log('  - Object keys:', Object.keys(lld))
          console.log('  - File list:', lld.fileList)
        }
      } else {
        console.log('❌ No LLD found in workflow data')
      }
      
      return lld
    } catch (error) {
      console.error('❌ Failed to debug LLD:', error)
      throw error
    }
  },

  // Test code generation with current project data
  testCodeGeneration: async (projectId: string) => {
    try {
      console.log('🧪 Testing code generation for project:', projectId)
      
      // First check if we have LLD
      const lld = await workflowDebug.debugLLD(projectId)
      if (!lld) {
        console.error('❌ Cannot test code generation - no LLD found')
        return
      }
      
      // Try to create a plan
      console.log('📋 Creating code generation plan...')
      const planResponse = await apiClient.post('/codegen/plan', { projectId })
      console.log('✅ Plan created:', planResponse.data)
      
      // Check if the plan looks project-specific
      const plan = planResponse.data.plan
      if (plan?.files) {
        console.log('📁 Generated files:')
        plan.files.forEach((file: any) => {
          console.log(`  - ${file.path}: ${file.purpose}`)
        })
        
        // Check for generic Twitter files
        const twitterFiles = plan.files.filter((file: any) => 
          file.path.toLowerCase().includes('tweet') || 
          file.purpose.toLowerCase().includes('tweet')
        )
        
        if (twitterFiles.length > 0) {
          console.warn('⚠️ Plan contains Twitter-specific files:', twitterFiles)
        } else {
          console.log('✅ Plan appears to be project-specific')
        }
      }
      
      return planResponse.data
    } catch (error: any) {
      console.error('❌ Failed to test code generation:', error.response?.data || error.message)
      throw error
    }
  },

  // Debug the LLD content directly from server
  debugLLDFromServer: async (projectId: string) => {
    try {
      console.log('🔍 Fetching LLD directly from server for project:', projectId)
      
      const response = await apiClient.get(`/debug/project/${projectId}/lld`)
      const data = response.data
      
      console.log('📊 LLD Debug Info:')
      console.log('  - Project Name:', data.projectName)
      console.log('  - Project Idea:', data.projectIdea)
      console.log('  - LLD Length:', data.lldLength)
      console.log('  - Social Terms Found:', data.socialTermsFound)
      console.log('  - Has Social Terms:', data.hasSocialTerms)
      console.log('  - Created At:', data.createdAt)
      
      if (data.hasSocialTerms) {
        console.warn('⚠️ LLD contains social media terms:', data.socialTermsFound)
        console.warn('⚠️ This explains why code generation produces Twitter files')
      }
      
      console.log('📝 LLD Preview (first 1000 chars):')
      console.log(data.lldPreview)
      
      return data
    } catch (error: any) {
      console.error('❌ Failed to debug LLD from server:', error.response?.data || error.message)
      
      // Fallback: try to get workflow status to see LLD content
      try {
        console.log('🔄 Trying fallback method to get LLD content...')
        const workflowData = await workflowDebug.debugWorkflowStatus(projectId)
        const lld = workflowData.results?.lld
        
        if (lld) {
          console.log('📝 LLD Content from workflow status:')
          const lldString = typeof lld === 'string' ? lld : JSON.stringify(lld)
          console.log('  - Length:', lldString.length)
          console.log('  - Preview:', lldString.substring(0, 500))
          
          // Check for social terms
          const socialTerms = ['tweet', 'twitter', 'social', 'post', 'follow']
          const foundTerms = socialTerms.filter(term => 
            lldString.toLowerCase().includes(term.toLowerCase())
          )
          
          if (foundTerms.length > 0) {
            console.warn('⚠️ LLD contains social media terms:', foundTerms)
          }
          
          return { lldContent: lldString, socialTermsFound: foundTerms }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError)
      }
      
      throw error
    }
  }
}

// Expose to window in development
if (import.meta.env.DEV) {
  (window as any).workflowDebug = workflowDebug
  console.log('🔍 Workflow debug utilities available on window.workflowDebug')
}