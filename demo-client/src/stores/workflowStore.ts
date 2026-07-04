// workflowStore.ts
// ----------------
// Manages workflow state for the unified WorkflowPage
// Handles stage progression, data persistence, and validation

import { create } from 'zustand'
import { apiClient } from '../services/api'

export enum WorkflowStage {
  PLANNING = 'planning',
  BLUEPRINT = 'blueprint',
  HLD = 'hld',
  LLD = 'lld',
  CODEGEN = 'codegen',
  COMPLETED = 'completed'
}

export enum StageStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface PlanningResult {
  answers: Record<string, string>
  submittedAt: string
  version: number
}

export interface AIResponse {
  id: string
  content: any
  rawJson: string
  version: number
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface Blueprint extends AIResponse {
  techStack: string[]
  features: string[]
  architecture: any
}

export interface HLD extends AIResponse {
  systemDesign: any
  components: any[]
  dataFlow: any
}

export interface LLD extends AIResponse {
  detailedDesign: any
  implementation: any
  specifications: any
}

export interface FileManifestEntry {
  path: string
  purpose: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  attempts: number
  error?: string
  size?: number
  lastModified?: string
  dependencies?: string[]
  language?: string
  priority?: 'high' | 'medium' | 'low'
  validationStatus?: 'valid' | 'invalid' | 'pending'
  validationErrors?: Array<{
    type: string
    message: string
    severity: 'error' | 'warning'
  }>
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

export interface CodeGenResult {
  manifest: FileManifest
  generatedFiles: string[]
  failedFiles: string[]
  completedAt?: string
  validationResult?: {
    isValid: boolean
    errors: Array<{
      type: string
      message: string
      severity: 'error' | 'warning'
    }>
    warnings: Array<{
      type: string
      message: string
      severity: 'error' | 'warning'
    }>
    score: number
  }
}

interface WorkflowState {
  // Current workflow state
  projectId: string | null
  currentStage: WorkflowStage
  stageStatus: Record<WorkflowStage, StageStatus>
  
  // Stage results
  planningResult: PlanningResult | null
  blueprint: Blueprint | null
  hld: HLD | null
  lld: LLD | null
  codegenResult: CodeGenResult | null
  
  // UI state
  loading: boolean
  error: string | null
  
  // Actions
  initializeWorkflow: (projectId: string) => Promise<void>
  setCurrentStage: (stage: WorkflowStage) => void
  updateStageStatus: (stage: WorkflowStage, status: StageStatus) => void
  
  // Planning actions
  savePlanningDraft: (answers: Record<string, string>) => Promise<void>
  submitPlanning: (answers: Record<string, string>) => Promise<void>
  
  // AI response actions
  approveResponse: (stage: WorkflowStage, responseId: string) => Promise<void>
  rejectResponse: (stage: WorkflowStage, responseId: string, feedback: string) => Promise<void>
  requestModification: (stage: WorkflowStage, responseId: string, changes: any) => Promise<void>
  
  // CodeGen actions
  startCodeGeneration: () => Promise<void>
  retryFileGeneration: (filePath: string) => Promise<void>
  retryFailedFiles: () => Promise<void>
  
  // Utility actions
  clearWorkflow: () => void
  canNavigateToStage: (stage: WorkflowStage) => boolean
}

const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  projectId: null,
  currentStage: WorkflowStage.PLANNING,
  stageStatus: {
    [WorkflowStage.PLANNING]: StageStatus.NOT_STARTED,
    [WorkflowStage.BLUEPRINT]: StageStatus.NOT_STARTED,
    [WorkflowStage.HLD]: StageStatus.NOT_STARTED,
    [WorkflowStage.LLD]: StageStatus.NOT_STARTED,
    [WorkflowStage.CODEGEN]: StageStatus.NOT_STARTED,
    [WorkflowStage.COMPLETED]: StageStatus.NOT_STARTED
  },
  
  planningResult: null,
  blueprint: null,
  hld: null,
  lld: null,
  codegenResult: null,
  
  loading: false,
  error: null,
  
  // Initialize workflow for a project
  initializeWorkflow: async (projectId: string) => {
    set({ loading: true, error: null, projectId })
    
    try {
      // Fetch existing workflow state from backend
      const { data } = await apiClient.get(`/projects/${projectId}/workflow/status`)
      
      const workflowData = data.workflow || {}
      
      // Map server response to frontend state structure
      const currentStage = workflowData.stage || WorkflowStage.PLANNING
      const serverStatus = workflowData.status || 'idle'
      
      // Create stage status based on current stage and server status
      const stageStatus = {
        [WorkflowStage.PLANNING]: StageStatus.NOT_STARTED,
        [WorkflowStage.BLUEPRINT]: StageStatus.NOT_STARTED,
        [WorkflowStage.HLD]: StageStatus.NOT_STARTED,
        [WorkflowStage.LLD]: StageStatus.NOT_STARTED,
        [WorkflowStage.CODEGEN]: StageStatus.NOT_STARTED,
        [WorkflowStage.COMPLETED]: StageStatus.NOT_STARTED
      }
      
      // Mark completed stages based on current stage
      const stageOrder = [
        WorkflowStage.PLANNING,
        WorkflowStage.BLUEPRINT,
        WorkflowStage.HLD,
        WorkflowStage.LLD,
        WorkflowStage.CODEGEN,
        WorkflowStage.COMPLETED
      ]
      
      const currentStageIndex = stageOrder.indexOf(currentStage as WorkflowStage)
      
      // Mark all previous stages as completed
      for (let i = 0; i < currentStageIndex; i++) {
        stageStatus[stageOrder[i]] = StageStatus.COMPLETED
      }
      
      // Set current stage status
      if (currentStageIndex >= 0) {
        if (serverStatus === 'in-progress') {
          stageStatus[currentStage as WorkflowStage] = StageStatus.IN_PROGRESS
        } else if (serverStatus === 'failed') {
          stageStatus[currentStage as WorkflowStage] = StageStatus.FAILED
        } else if (currentStage === WorkflowStage.COMPLETED) {
          stageStatus[WorkflowStage.COMPLETED] = StageStatus.COMPLETED
        } else {
          stageStatus[currentStage as WorkflowStage] = StageStatus.IN_PROGRESS
        }
      }
      
      // Extract results from server response
      const results = workflowData.results || {}
      
      set({
        currentStage: currentStage as WorkflowStage,
        stageStatus,
        planningResult: results.planning ? {
          answers: results.planning.answers || {},
          submittedAt: new Date().toISOString(),
          version: 1
        } : null,
        blueprint: results.blueprint ? {
          content: typeof results.blueprint === 'string' ? results.blueprint : JSON.stringify(results.blueprint),
          status: 'completed',
          timestamp: new Date().toISOString(),
          version: 1
        } : null,
        hld: results.hld ? {
          content: typeof results.hld === 'string' ? results.hld : JSON.stringify(results.hld),
          status: 'completed',
          timestamp: new Date().toISOString(),
          version: 1
        } : null,
        lld: results.lld ? {
          content: typeof results.lld === 'string' ? results.lld : JSON.stringify(results.lld),
          status: 'completed',
          timestamp: new Date().toISOString(),
          version: 1
        } : null,
        codegenResult: results.codegen || null,
        loading: false
      })
    } catch (error) {
      set({ 
        loading: false, 
        error: 'Failed to load workflow state' 
      })
    }
  },
  
  // Set current stage
  setCurrentStage: (stage: WorkflowStage) => {
    const state = get()
    if (state.canNavigateToStage(stage)) {
      set({ currentStage: stage })
    }
  },
  
  // Update stage status
  updateStageStatus: (stage: WorkflowStage, status: StageStatus) => {
    set((state) => ({
      stageStatus: {
        ...state.stageStatus,
        [stage]: status
      }
    }))
  },
  
  // Save planning draft
  savePlanningDraft: async (answers: Record<string, string>) => {
    const { projectId } = get()
    if (!projectId) return
    
    try {
      // Note: This is a local save operation for now
      // The server doesn't have a draft endpoint, so we'll store locally
      console.log('Saving planning draft locally:', answers)
      // TODO: Implement server-side draft saving if needed
    } catch (error) {
      console.error('Failed to save planning draft:', error)
    }
  },
  
  // Submit planning answers
  submitPlanning: async (answers: Record<string, string>) => {
    const { projectId } = get()
    if (!projectId) return
    
    set({ loading: true, error: null })
    
    try {
      const { data } = await apiClient.post('/planning/clarify/answer', { 
        projectId,
        answers 
      })
      
      const planningResult: PlanningResult = {
        answers,
        submittedAt: new Date().toISOString(),
        version: 1
      }
      
      set({
        planningResult,
        loading: false
      })
      
      get().updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED)
      get().updateStageStatus(WorkflowStage.BLUEPRINT, StageStatus.IN_PROGRESS)
      get().setCurrentStage(WorkflowStage.BLUEPRINT)
      
    } catch (error) {
      set({ 
        loading: false, 
        error: 'Failed to submit planning answers' 
      })
      get().updateStageStatus(WorkflowStage.PLANNING, StageStatus.FAILED)
    }
  },
  
  // Approve AI response
  approveResponse: async (stage: WorkflowStage, responseId: string) => {
    const { projectId } = get()
    if (!projectId) return
    
    set({ loading: true, error: null })
    
    try {
      await apiClient.post(`/projects/${projectId}/${stage}/${responseId}/approve`)
      
      // Update the response status locally
      const stateKey = stage as keyof Pick<WorkflowState, 'blueprint' | 'hld' | 'lld'>
      const currentResponse = get()[stateKey] as AIResponse | null
      
      if (currentResponse && currentResponse.id === responseId) {
        set({
          [stateKey]: {
            ...currentResponse,
            status: 'approved'
          }
        })
      }
      
      // Move to next stage
      const nextStage = getNextStage(stage)
      if (nextStage) {
        get().updateStageStatus(stage, StageStatus.COMPLETED)
        get().updateStageStatus(nextStage, StageStatus.IN_PROGRESS)
        get().setCurrentStage(nextStage)
      }
      
      set({ loading: false })
      
    } catch (error) {
      set({ 
        loading: false, 
        error: 'Failed to approve response' 
      })
    }
  },
  
  // Reject AI response
  rejectResponse: async (stage: WorkflowStage, responseId: string, feedback: string) => {
    const { projectId } = get()
    if (!projectId) return
    
    set({ loading: true, error: null })
    
    try {
      await apiClient.post(`/projects/${projectId}/${stage}/${responseId}/reject`, { feedback })
      
      // Update the response status locally
      const stateKey = stage as keyof Pick<WorkflowState, 'blueprint' | 'hld' | 'lld'>
      const currentResponse = get()[stateKey] as AIResponse | null
      
      if (currentResponse && currentResponse.id === responseId) {
        set({
          [stateKey]: {
            ...currentResponse,
            status: 'rejected'
          }
        })
      }
      
      get().updateStageStatus(stage, StageStatus.IN_PROGRESS)
      set({ loading: false })
      
    } catch (error) {
      set({ 
        loading: false, 
        error: 'Failed to reject response' 
      })
    }
  },
  
  // Request modification
  requestModification: async (stage: WorkflowStage, responseId: string, changes: any) => {
    const { projectId } = get()
    if (!projectId) return
    
    set({ loading: true, error: null })
    
    try {
      await apiClient.post(`/projects/${projectId}/${stage}/${responseId}/modify`, { changes })
      get().updateStageStatus(stage, StageStatus.IN_PROGRESS)
      set({ loading: false })
      
    } catch (error) {
      set({ 
        loading: false, 
        error: 'Failed to request modification' 
      })
    }
  },
  
  // Start code generation with manifest
  startCodeGeneration: async () => {
    const { projectId, blueprint, hld, lld } = get()
    if (!projectId || !blueprint || !hld || !lld) return
    
    set({ loading: true, error: null })
    get().updateStageStatus(WorkflowStage.CODEGEN, StageStatus.IN_PROGRESS)
    
    try {
      // First create manifest if it doesn't exist
      let manifest: FileManifest
      const existingResult = get().codegenResult
      
      if (existingResult?.manifest) {
        manifest = existingResult.manifest
      } else {
        const manifestResponse = await apiClient.post('/codegen/plan', {
          projectId,
          context: {
            blueprint: blueprint.content,
            hld: hld.content,
            lld: lld.content
          }
        })
        
        if (!manifestResponse.data.success) {
          throw new Error('Failed to create file manifest')
        }
        
        manifest = manifestResponse.data.manifest
      }
      
      // Start generation
      const { data } = await apiClient.post('/codegen/apply', {
        projectId,
        manifestId: manifest.id
      })
      
      const codegenResult: CodeGenResult = {
        manifest,
        generatedFiles: [],
        failedFiles: [],
        validationResult: data.validationResult
      }
      
      set({ codegenResult, loading: false })
      
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.message || 'Failed to start code generation' 
      })
      get().updateStageStatus(WorkflowStage.CODEGEN, StageStatus.FAILED)
    }
  },
  
  // Retry file generation
  retryFileGeneration: async (filePath: string) => {
    const { projectId, codegenResult } = get()
    if (!projectId || !codegenResult) return
    
    try {
      await apiClient.post('/codegen/apply', { 
        projectId,
        filePath,
        priority: 'high'
      })
      
      // Update file status locally
      const updatedManifest = {
        ...codegenResult.manifest,
        files: codegenResult.manifest.files.map(file =>
          file.path === filePath
            ? { ...file, status: 'in_progress' as const, attempts: file.attempts + 1 }
            : file
        )
      }
      
      set({
        codegenResult: {
          ...codegenResult,
          manifest: updatedManifest
        }
      })
      
    } catch (error) {
      console.error('Failed to retry file generation:', error)
    }
  },
  
  // Retry all failed files
  retryFailedFiles: async () => {
    const { projectId, codegenResult } = get()
    if (!projectId || !codegenResult) return
    
    try {
      await apiClient.post('/codegen/applyBatch', {
        projectId,
        priority: 'high'
      })
      
      // Update all failed files to in_progress
      const updatedManifest = {
        ...codegenResult.manifest,
        files: codegenResult.manifest.files.map(file =>
          file.status === 'failed'
            ? { ...file, status: 'in_progress' as const, attempts: file.attempts + 1 }
            : file
        )
      }
      
      set({
        codegenResult: {
          ...codegenResult,
          manifest: updatedManifest
        }
      })
      
    } catch (error) {
      console.error('Failed to retry failed files:', error)
    }
  },
  
  // Clear workflow state
  clearWorkflow: () => {
    set({
      projectId: null,
      currentStage: WorkflowStage.PLANNING,
      stageStatus: {
        [WorkflowStage.PLANNING]: StageStatus.NOT_STARTED,
        [WorkflowStage.BLUEPRINT]: StageStatus.NOT_STARTED,
        [WorkflowStage.HLD]: StageStatus.NOT_STARTED,
        [WorkflowStage.LLD]: StageStatus.NOT_STARTED,
        [WorkflowStage.CODEGEN]: StageStatus.NOT_STARTED,
        [WorkflowStage.COMPLETED]: StageStatus.NOT_STARTED
      },
      planningResult: null,
      blueprint: null,
      hld: null,
      lld: null,
      codegenResult: null,
      loading: false,
      error: null
    })
  },
  
  // Check if user can navigate to a stage
  canNavigateToStage: (stage: WorkflowStage) => {
    const { stageStatus } = get()
    
    // Always allow navigation to planning
    if (stage === WorkflowStage.PLANNING) return true
    
    // For other stages, check if previous stages are completed
    const stageOrder = [
      WorkflowStage.PLANNING,
      WorkflowStage.BLUEPRINT,
      WorkflowStage.HLD,
      WorkflowStage.LLD,
      WorkflowStage.CODEGEN,
      WorkflowStage.COMPLETED
    ]
    
    const targetIndex = stageOrder.indexOf(stage)
    
    // Check if all previous stages are completed
    for (let i = 0; i < targetIndex; i++) {
      const prevStage = stageOrder[i]
      if (stageStatus[prevStage] !== StageStatus.COMPLETED) {
        return false
      }
    }
    
    return true
  }
}))

// Helper function to get next stage
function getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
  const stageOrder = [
    WorkflowStage.PLANNING,
    WorkflowStage.BLUEPRINT,
    WorkflowStage.HLD,
    WorkflowStage.LLD,
    WorkflowStage.CODEGEN,
    WorkflowStage.COMPLETED
  ]
  
  const currentIndex = stageOrder.indexOf(currentStage)
  return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null
}

export default useWorkflowStore