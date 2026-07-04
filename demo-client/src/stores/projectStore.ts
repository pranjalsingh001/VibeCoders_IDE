// projectStore.ts
// ---------------
// Project management state

import { create } from 'zustand'
import { apiClient } from '../services/api'

export type WorkflowStage = 'planning' | 'blueprint' | 'hld' | 'lld' | 'codegen' | 'completed'
export type ProjectStatus = 'planned' | 'blueprint-ready' | 'in-progress' | 'completed'

export interface Project {
  _id: string
  id: string
  name: string
  description?: string
  idea?: string
  userId: string
  status: ProjectStatus
  currentStage: WorkflowStage
  stageResults: Record<string, any>
  createdAt: string
  updatedAt: string
  owner?: string
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchProjects: () => Promise<void>
  createProject: (data: Partial<Project>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
  clearError: () => void
}

const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  
  fetchProjects: async () => {
    set({ loading: true, error: null })
    
    try {
      const { data } = await apiClient.get('/projects')
      // Ensure projects have the required fields with defaults
      const projects = (data.projects || []).map((project: any) => ({
        ...project,
        id: project.id || project._id,
        _id: project._id || project.id,
        status: project.status || 'planned',
        currentStage: project.currentStage || 'planning',
        stageResults: project.stageResults || {},
        owner: project.owner || project.userId
      }))
      set({ projects, loading: false })
    } catch (error) {
      set({ loading: false, error: 'Failed to fetch projects' })
    }
  },
  
  createProject: async (projectData: Partial<Project>) => {
    set({ loading: true, error: null })
    
    try {
      const { data } = await apiClient.post('/projects', projectData)
      const newProject = {
        ...data.project,
        id: data.project.id || data.project._id,
        _id: data.project._id || data.project.id,
        status: data.project.status || 'planned',
        currentStage: data.project.currentStage || 'planning',
        stageResults: data.project.stageResults || {},
        owner: data.project.owner || data.project.userId
      }
      
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false
      }))
      
      return newProject
    } catch (error) {
      set({ loading: false, error: 'Failed to create project' })
      throw error
    }
  },
  
  updateProject: async (id: string, projectData: Partial<Project>) => {
    set({ loading: true, error: null })
    
    try {
      const { data } = await apiClient.put(`/projects/${id}`, projectData)
      const updatedProject = data.project
      
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: 'Failed to update project' })
    }
  },
  
  deleteProject: async (id: string) => {
    set({ loading: true, error: null })
    
    try {
      await apiClient.delete(`/projects/${id}`)
      
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: 'Failed to delete project' })
    }
  },
  
  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project })
  },
  
  clearError: () => {
    set({ error: null })
  }
}))

export default useProjectStore