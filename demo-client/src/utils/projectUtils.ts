// utils/projectUtils.ts
// ---------------------
// Utility functions for project management

import { Project, ProjectStatus, WorkflowStage } from '../stores/projectStore'

export const getProjectDisplayStatus = (project: Project): { 
  status: ProjectStatus, 
  label: string, 
  color: string 
} => {
  // Determine status based on current stage and completion
  if (project.currentStage === 'completed') {
    return { status: 'completed', label: 'Completed', color: 'green' }
  }
  
  if (project.currentStage === 'codegen' || project.currentStage === 'lld') {
    return { status: 'in-progress', label: 'In Progress', color: 'blue' }
  }
  
  if (project.currentStage === 'blueprint' || project.currentStage === 'hld') {
    return { status: 'blueprint-ready', label: 'Blueprint Ready', color: 'purple' }
  }
  
  return { status: 'planned', label: 'Planned', color: 'gray' }
}

export const getStageDisplayName = (stage: WorkflowStage): string => {
  const stageNames: Record<WorkflowStage, string> = {
    planning: 'Planning',
    blueprint: 'Blueprint',
    hld: 'High-Level Design',
    lld: 'Low-Level Design', 
    codegen: 'Code Generation',
    completed: 'Completed'
  }
  
  return stageNames[stage] || stage
}

export const formatLastUpdated = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}