// src/services/workflowService.ts
import { apiClient } from "./api"

export const workflowAPI = {
  status: async (projectId: string) => {
    const { data } = await apiClient.get(`/projects/${projectId}/workflow/status`)
    return data
  },

  next: async (projectId: string) => {
    const { data } = await apiClient.post(`/projects/${projectId}/workflow/next`, {})
    return data
  },

  reset: async (projectId: string) => {
    const { data } = await apiClient.post(`/projects/${projectId}/workflow/reset`, {})
    return data
  }
}
