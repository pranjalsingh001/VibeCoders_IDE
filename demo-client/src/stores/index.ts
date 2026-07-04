// stores/index.ts
// ---------------
// Central export for all Zustand stores

export { default as useAuthStore } from './authStore'
export { default as useProjectStore } from './projectStore'
export { default as useWorkflowStore } from './workflowStore'
export { default as useFileStore } from './fileStore'
export { default as useWorkspaceStore } from './workspaceStore'
export { default as useUIStore } from './uiStore'

// Export types
export type { Project } from './projectStore'
export type { 
  WorkflowStage, 
  StageStatus, 
  PlanningResult, 
  AIResponse, 
  Blueprint, 
  HLD, 
  LLD, 
  FileManifest, 
  FileManifestEntry, 
  CodeGenResult 
} from './workflowStore'
export type { Toast, ToastAction } from './uiStore'