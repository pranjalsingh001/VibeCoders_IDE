// fileStore.ts
// ------------
// File management state for workspace

import { create } from 'zustand'
import { apiClient } from '../services/api'

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  content?: string
  size?: number
  lastModified?: string
  children?: FileNode[]
}

interface FileState {
  files: FileNode[]
  currentFile: FileNode | null
  openFiles: FileNode[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchFiles: (projectId: string) => Promise<void>
  openFile: (file: FileNode) => Promise<void>
  closeFile: (fileId: string) => void
  saveFile: (fileId: string, content: string) => Promise<void>
  createFile: (projectId: string, path: string, content?: string) => Promise<void>
  deleteFile: (projectId: string, path: string) => Promise<void>
  setCurrentFile: (file: FileNode | null) => void
  clearError: () => void
}

const useFileStore = create<FileState>((set, get) => ({
  files: [],
  currentFile: null,
  openFiles: [],
  loading: false,
  error: null,
  
  fetchFiles: async (projectId: string) => {
    set({ loading: true, error: null })
    
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/files`)
      set({ files: data.files, loading: false })
    } catch (error) {
      set({ loading: false, error: 'Failed to fetch files' })
    }
  },
  
  openFile: async (file: FileNode) => {
    if (file.type === 'folder') return
    
    set({ loading: true, error: null })
    
    try {
      // If file content is not loaded, fetch it
      if (!file.content) {
        const { data } = await apiClient.get(`/files/${file.id}/content`)
        file.content = data.content
      }
      
      set((state) => ({
        currentFile: file,
        openFiles: state.openFiles.find(f => f.id === file.id) 
          ? state.openFiles 
          : [...state.openFiles, file],
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: 'Failed to open file' })
    }
  },
  
  closeFile: (fileId: string) => {
    set((state) => ({
      openFiles: state.openFiles.filter(f => f.id !== fileId),
      currentFile: state.currentFile?.id === fileId ? null : state.currentFile
    }))
  },
  
  saveFile: async (fileId: string, content: string) => {
    set({ loading: true, error: null })
    
    try {
      await apiClient.put(`/files/${fileId}`, { content })
      
      set((state) => ({
        openFiles: state.openFiles.map(f => 
          f.id === fileId ? { ...f, content } : f
        ),
        currentFile: state.currentFile?.id === fileId 
          ? { ...state.currentFile, content }
          : state.currentFile,
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: 'Failed to save file' })
    }
  },
  
  createFile: async (projectId: string, path: string, content = '') => {
    set({ loading: true, error: null })
    
    try {
      const { data } = await apiClient.post(`/projects/${projectId}/files`, {
        path,
        content
      })
      
      const newFile = data.file
      
      set((state) => ({
        files: [...state.files, newFile],
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: 'Failed to create file' })
    }
  },
  
  deleteFile: async (projectId: string, path: string) => {
    set({ loading: true, error: null })
    
    try {
      await apiClient.delete(`/projects/${projectId}/files`, {
        data: { path }
      })
      
      set((state) => ({
        files: state.files.filter(f => f.path !== path),
        openFiles: state.openFiles.filter(f => f.path !== path),
        currentFile: state.currentFile?.path === path ? null : state.currentFile,
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: 'Failed to delete file' })
    }
  },
  
  setCurrentFile: (file: FileNode | null) => {
    set({ currentFile: file })
  },
  
  clearError: () => {
    set({ error: null })
  }
}))

export default useFileStore