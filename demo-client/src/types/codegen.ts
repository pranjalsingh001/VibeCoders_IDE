// codegen.ts
// ----------
// Type definitions for CodeGen Manager with manifest validation
// Defines file manifest, validation, and progress tracking interfaces

export enum FileStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface FileManifestEntry {
  path: string
  purpose: string
  status: FileStatus
  attempts: number
  error?: string
  size?: number
  lastModified?: string
  dependencies?: string[]
  language?: string
  priority?: 'high' | 'medium' | 'low'
  validationStatus?: 'valid' | 'invalid' | 'pending'
  validationErrors?: ValidationError[]
}

export interface FileManifest {
  id: string
  projectId: string
  files: FileManifestEntry[]
  totalFiles: number
  completedFiles: number
  failedFiles: number
  pendingFiles: number
  inProgressFiles: number
  createdAt: string
  updatedAt: string
  version: number
}

export interface ValidationError {
  type: 'missing_feature' | 'incorrect_implementation' | 'dependency_error' | 'syntax_error'
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
  line?: number
  column?: number
}

export interface ManifestValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  missingFiles: string[]
  extraFiles: string[]
  score: number // 0-100 completeness score
}

export interface CodeGenProgress {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  pendingFiles: number
  inProgressFiles: number
  percentage: number
  estimatedTimeRemaining?: number
  currentFile?: string
}

export interface RetryOperation {
  filePath: string
  attempts: number
  lastError?: string
  nextRetryAt?: string
  priority: 'high' | 'medium' | 'low'
}

export interface BulkRetryResult {
  success: boolean
  retriedFiles: string[]
  failedRetries: string[]
  message: string
}

export interface FileGenerationRequest {
  filePath: string
  purpose: string
  dependencies?: string[]
  context?: {
    blueprint?: any
    hld?: any
    lld?: any
    relatedFiles?: string[]
  }
  priority?: 'high' | 'medium' | 'low'
}

export interface FileGenerationResult {
  filePath: string
  success: boolean
  content?: string
  error?: string
  warnings?: string[]
  metadata?: {
    size: number
    language: string
    dependencies: string[]
  }
}

export interface CodeGenManagerState {
  manifest: FileManifest | null
  progress: CodeGenProgress
  validationResult: ManifestValidationResult | null
  retryQueue: RetryOperation[]
  isGenerating: boolean
  isValidating: boolean
  error: string | null
  lastUpdate: string
}

// WebSocket event types for real-time updates
export interface FileGenerationUpdateEvent {
  type: 'file_generation_update'
  projectId: string
  filePath: string
  status: FileStatus
  error?: string
  progress?: number
  metadata?: any
}

export interface ManifestUpdateEvent {
  type: 'manifest_update'
  projectId: string
  manifest: FileManifest
  validationResult?: ManifestValidationResult
}

export interface ProgressUpdateEvent {
  type: 'progress_update'
  projectId: string
  progress: CodeGenProgress
  currentFile?: string
}

export interface RetryQueueUpdateEvent {
  type: 'retry_queue_update'
  projectId: string
  retryQueue: RetryOperation[]
}

// API response types
export interface CreateManifestResponse {
  success: boolean
  manifest: FileManifest
  validationResult: ManifestValidationResult
  message?: string
}

export interface StartGenerationResponse {
  success: boolean
  jobId: string
  manifest: FileManifest
  estimatedDuration?: number
  message?: string
}

export interface RetryFileResponse {
  success: boolean
  filePath: string
  jobId?: string
  message?: string
}

export interface ValidationResponse {
  success: boolean
  validationResult: ManifestValidationResult
  recommendations?: string[]
  message?: string
}