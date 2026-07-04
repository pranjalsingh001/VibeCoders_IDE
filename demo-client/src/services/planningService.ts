// src/services/planningService.ts
// -------------------------------
// Thin wrapper around planning endpoints:
// - POST /planning/clarify
// - POST /planning/clarify/answer
//
// Keeps all project-planning related API calls in one place.

import { apiClient } from './api'

export type ClarifyRequest = {
  projectId: string
  projectName?: string
  ideaDescription?: string
}

export type ClarifyResponse = {
  success: boolean
  questions: string[]
  projectId?: string
}

export const planningAPI = {
  // Ask backend to generate clarification questions for a project idea
  clarify: async (payload: ClarifyRequest): Promise<ClarifyResponse> => {
    const { data } = await apiClient.post('/planning/clarify', payload)
    return data
  },

  // Submit answers to clarification questions
  submitAnswers: async (payload: { projectId: string; answers: string[] }) => {
    const { data } = await apiClient.post('/planning/clarify/answer', payload)
    return data
  }
}
