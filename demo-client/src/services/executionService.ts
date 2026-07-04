// src/services/executionService.ts
// ---------------------------------
// Unified: now only uses project-scoped session routes.

import { apiClient } from './api'

export const executionAPI = {
  // Start a new session for a project
  start: async (projectId: string) => {
    const { data } = await apiClient.post(`/projects/${projectId}/session/start`, {})
    return data // should contain { success, session: { id, status, url? } }
  },

  // Stop the active session for a project
  stop: async (projectId: string) => {
    const { data } = await apiClient.post(`/projects/${projectId}/session/stop`, {})
    return data
  },

  // Get the current session status
  status: async (projectId: string) => {
    const { data } = await apiClient.get(`/projects/${projectId}/session/status`)
    return data
  }
}
