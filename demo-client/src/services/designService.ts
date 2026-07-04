// src/services/designService.ts
import { apiClient } from './api';

// Types for design generation
export type GenerateDesignParams =
  | { projectId: string }
  | { projectName: string; ideaDescription: string };

export const designAPI = {
  /**
   * Generate High-Level Design (HLD) for a project.
   * @param params - Either projectId or projectName & ideaDescription
   */
  generateHLD: async (params: GenerateDesignParams) => {
    const response = await apiClient.post('/design/hld', params);
    return response.data;
  },

  /**
   * Generate Low-Level Design (LLD) for a project.
   * @param params - Either projectId or projectName & ideaDescription
   */
  generateLLD: async (params: GenerateDesignParams) => {
    const response = await apiClient.post('/design/lld', params);
    return response.data;
  },

  /**
   * Fetch design docs (HLD/LLD) for a project
   * @param projectId - The project ID
   * @param type - Optional: "HLD" or "LLD" to filter by document type
   */
  getDesignDocs: async (projectId: string, type?: "HLD" | "LLD") => {
    const response = await apiClient.get(`/design/docs`, { params: { projectId, type } });
    return response.data;
  },
};
