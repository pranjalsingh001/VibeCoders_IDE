// src/services/blueprintService.ts
// -------------------------------
// Now includes:
// - GET /blueprint/:projectId
// - POST /blueprint/generate
import { apiClient } from './api'

export type BlueprintRequest = { projectId: string }
export type BlueprintResponse = {
  success: boolean
  projectId?: string
  message?: string
  blueprint: {
    _id: string
    projectName?: string
    ideaDescription?: string
    clarifications?: Record<string, any>
    generatedBlueprint?: {
      projectName?: string
      ideaDescription?: string
      clarifications?: Record<string, any>
      content?: string
      versions?: string | number
      createdAt?: string
    }
    content?: any // fallback for older format
    createdAt?: string
    updatedAt?: string
    version?: number
  }
}


export const blueprintAPI = {
  // Fetch existing blueprint 
  fetch: async (projectId: string): Promise<BlueprintResponse> => {
    const { data } = await apiClient.get(`/blueprint/${projectId}`)
    return data
  },

  // Generate  blueprint
  generate: async (payload: BlueprintRequest): Promise<BlueprintResponse> => {
    const { data } = await apiClient.post('/blueprint/generate', payload)
    return data
  }
}
