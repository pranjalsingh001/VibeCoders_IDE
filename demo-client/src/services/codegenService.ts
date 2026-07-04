// src/services/codegenService.ts
// ------------------------------
// Enhanced service for code generation with manifest validation

import { apiClient } from './api'
import {
  FileManifest,
  ManifestValidationResult,
  FileGenerationRequest,
  FileGenerationResult,
  BulkRetryResult,
  CreateManifestResponse,
  StartGenerationResponse,
  RetryFileResponse,
  ValidationResponse,
  CodeGenProgress
} from '../types/codegen'

// Legacy types for backward compatibility
export type CodegenPlan = {
  files: Array<{
    path: string
    purpose: string
    language?: string
    dependencies?: string[]
  }>
}

export type CodegenStatus = {
  [filePath: string]: {
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
    attempts: number
    lastAttempt: Date | null
    error: string | null
  }
}

export type CodegenResult = {
  success: boolean
  message?: string
  files?: Array<{
    file: string
    status: 'ok' | 'error'
    error?: string
  }>
  written?: number
  dryRun?: boolean
  jobIds?: string[]
  queueStats?: {
    total: number
    waiting: number
    processing: number
    completed: number
    failed: number
  }
}

export type FinalizeResult = {
  success: boolean
  message: string
  results: {
    linting: {
      status: 'passed' | 'warning' | 'failed'
      message: string
    }
    testing: {
      status: 'passed' | 'warning' | 'failed'
      message: string
    }
    build: {
      status: 'created' | 'failed'
      path?: string
      message?: string
    }
  }
}

export const codegenAPI = {
  // ===== ENHANCED MANIFEST-BASED API =====
  
  // Create file manifest with validation against blueprint/HLD/LLD
  createManifest: async (
    projectId: string,
    context: {
      blueprint?: any
      hld?: any
      lld?: any
    }
  ): Promise<CreateManifestResponse> => {
    const { data } = await apiClient.post('/codegen/manifest/create', {
      projectId,
      context
    })
    return data
  },

  // Get current manifest for a project
  getManifest: async (projectId: string): Promise<{ success: boolean; manifest: FileManifest | null }> => {
    const { data } = await apiClient.get(`/codegen/manifest/${projectId}`)
    return data
  },

  // Validate manifest against design requirements
  validateManifest: async (
    projectId: string,
    manifestId: string
  ): Promise<ValidationResponse> => {
    const { data } = await apiClient.post('/codegen/manifest/validate', {
      projectId,
      manifestId
    })
    return data
  },

  // Start generation based on manifest
  startGeneration: async (
    projectId: string,
    options: {
      manifestId: string
      priority?: 'high' | 'medium' | 'low'
      selectedFiles?: string[]
    }
  ): Promise<StartGenerationResponse> => {
    const { data } = await apiClient.post('/codegen/generate/start', {
      projectId,
      ...options
    })
    return data
  },

  // Get real-time progress
  getProgress: async (projectId: string): Promise<{ success: boolean; progress: CodeGenProgress }> => {
    const { data } = await apiClient.get(`/codegen/progress/${projectId}`)
    return data
  },

  // Retry specific file generation
  retryFile: async (
    projectId: string,
    filePath: string,
    options?: {
      priority?: 'high' | 'medium' | 'low'
      context?: any
    }
  ): Promise<RetryFileResponse> => {
    const { data } = await apiClient.post('/codegen/retry/file', {
      projectId,
      filePath,
      ...options
    })
    return data
  },

  // Bulk retry failed files
  retryFailedFiles: async (
    projectId: string,
    options?: {
      priority?: 'high' | 'medium' | 'low'
      maxRetries?: number
    }
  ): Promise<BulkRetryResult> => {
    const { data } = await apiClient.post('/codegen/retry/bulk', {
      projectId,
      ...options
    })
    return data
  },

  // Generate specific file with context
  generateFile: async (
    projectId: string,
    request: FileGenerationRequest
  ): Promise<FileGenerationResult> => {
    const { data } = await apiClient.post('/codegen/generate/file', {
      projectId,
      ...request
    })
    return data
  },

  // Stop ongoing generation
  stopGeneration: async (projectId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/codegen/generate/stop', { projectId })
    return data
  },

  // ===== LEGACY API (for backward compatibility) =====
  
  // Create a code generation plan
  createPlan: async (projectId: string): Promise<{ success: boolean; plan: CodegenPlan }> => {
    const { data } = await apiClient.post('/codegen/plan', { projectId })
    return data
  },

  // Apply plan (basic method)
  applyPlan: async (
    projectId: string,
    options: { dryRun?: boolean; paths?: string[] } = {}
  ): Promise<CodegenResult> => {
    const { data } = await apiClient.post('/codegen/apply', { projectId, ...options })
    return data
  },

  // Apply plan in batches
  applyPlanBatch: async (
    projectId: string,
    options: { dryRun?: boolean; paths?: string[] } = {}
  ): Promise<CodegenResult> => {
    const { data } = await apiClient.post('/codegen/applyBatch', { projectId, ...options })
    return data
  },

  // Apply plan using queue system (recommended)
  applyPlanQueue: async (
    projectId: string,
    options: { dryRun?: boolean; paths?: string[] } = {}
  ): Promise<CodegenResult> => {
    const { data } = await apiClient.post('/codegen/applyQueue', { projectId, ...options })
    return data
  },

  // Get codegen status
  getStatus: async (projectId: string): Promise<{ success: boolean; status: CodegenStatus }> => {
    const { data } = await apiClient.get('/codegen/status', { params: { projectId } })
    return data
  },

  // Finalize code generation (linting, testing, build)
  finalize: async (projectId: string): Promise<FinalizeResult> => {
    const { data } = await apiClient.post('/codegen/finalize', { projectId })
    return data
  }
}
