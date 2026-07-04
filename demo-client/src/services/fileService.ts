// fileService.ts
// --------------
// Handles project file operations (list, read, write)

import { apiClient } from './api'

export type FileEntry = {
  name: string
  type: 'file' | 'dir'
}

export const fileService = {
  list: async (projectId: string, dir: string = '/'): Promise<FileEntry[]> => {
    try {
      const { data } = await apiClient.get(`/files/list?projectId=${projectId}&dir=${encodeURIComponent(dir)}`)
      // Extract from wrapped response: data.data.entries or fallback
      const payload = data.data || data
      return payload?.entries ?? payload ?? []
    } catch (err: any) {
      console.error('[File List Error]', err.response?.data || err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Failed to list files'
      throw new Error(errorMsg)
    }
  },

  read: async (projectId: string, relativePath: string): Promise<string> => {
    try {
      const { data } = await apiClient.get(`/files/read?projectId=${projectId}&relativePath=${encodeURIComponent(relativePath)}`)
      // Extract from wrapped response
      const payload = data.data || data
      return payload.content
    } catch (err: any) {
      console.error('[File Read Error]', err.response?.data || err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Failed to read file'
      throw new Error(errorMsg)
    }
  },

  write: async (projectId: string, relativePath: string, content: string): Promise<void> => {
    try {
      await apiClient.post('/files/write', { projectId, relativePath, content })
    } catch (err: any) {
      console.error('[File Write Error]', err.response?.data || err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Failed to write file'
      throw new Error(errorMsg)
    }
  },

  createFolder: async (projectId: string, relativePath: string): Promise<void> => {
    try {
      await apiClient.post('/files/create-folder', { projectId, relativePath })
    } catch (err: any) {
      console.error('[Create Folder Error]', err.response?.data || err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Failed to create folder'
      throw new Error(errorMsg)
    }
  },

  delete: async (projectId: string, relativePath: string): Promise<void> => {
    try {
      await apiClient.delete(`/files/delete?projectId=${projectId}&relativePath=${encodeURIComponent(relativePath)}`)
    } catch (err: any) {
      console.error('[File Delete Error]', err.response?.data || err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Failed to delete file'
      throw new Error(errorMsg)
    }
  }
}
