// src/services/projectService.ts
// ------------------------------
// Thin service wrapper for project-related API calls.
// This provides a single place if we later change endpoints or add retries/caching.

import { apiClient } from './api'
import type { Project } from '../stores/projectStore'

export const projectAPI = {
  list: async () => {
    const { data } = await apiClient.get('/projects')
    return data.projects as Project[]
  },

  create: async (payload: { name: string; idea?: string }) => {
    const { data } = await apiClient.post('/projects/create', payload)
    return data.project as Project
  },

  get: async (projectId: string) => {
    const { data } = await apiClient.get(`/projects/${projectId}`)
    return data.project as Project
  },

  delete: async (projectId: string) => {
    return apiClient.delete(`/projects/${projectId}`)
  }
}
