// workspaceStore.ts
// -----------------
// Enhanced workspace environment state with file management and IDE features

import { create } from 'zustand'
import { apiClient } from '../services/api'

export interface TerminalSession {
  id: string
  name: string
  active: boolean
  logs: TerminalLog[]
}

export interface TerminalLog {
  id: string
  type: 'stdout' | 'stderr' | 'info' | 'error'
  message: string
  timestamp: string
}

export interface ExecutionStatus {
  isRunning: boolean
  command?: string
  startTime?: string
  exitCode?: number
}

export interface FileItem {
  name: string
  type: 'file' | 'dir'
  size?: number
  lastModified?: string
}

export interface OpenTab {
  id: string
  filePath: string
  fileName: string
  content: string
  isDirty: boolean
  language: string
}

interface WorkspaceState {
  // Project and terminal state
  projectId: string | null
  terminalSessions: TerminalSession[]
  activeTerminal: string | null
  executionStatus: ExecutionStatus
  loading: boolean
  error: string | null
  
  // File management state
  files: FileItem[]
  currentDir: string
  activeFile: string | null
  fileContent: string
  unsavedChanges: boolean
  
  // Enhanced IDE features
  openTabs: OpenTab[]
  activeTabId: string | null
  autoSaveEnabled: boolean
  aiAssistVisible: boolean
  
  // Actions - Terminal
  initializeWorkspace: (projectId: string) => Promise<void>
  createTerminalSession: (name?: string) => string
  setActiveTerminal: (sessionId: string) => void
  addTerminalLog: (sessionId: string, log: Omit<TerminalLog, 'id'>) => void
  clearTerminalLogs: (sessionId: string) => void
  executeCommand: (command: string) => Promise<void>
  stopExecution: () => Promise<void>
  clearWorkspace: () => void
  
  // Actions - File Management
  setFiles: (files: FileItem[]) => void
  setCurrentDir: (dir: string) => void
  setActiveFile: (filePath: string | null) => void
  setFileContent: (content: string) => void
  markUnsaved: (unsaved: boolean) => void
  
  // Actions - Enhanced IDE
  openTab: (filePath: string, content: string) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  markTabDirty: (tabId: string, isDirty: boolean) => void
  toggleAutoSave: () => void
  toggleAIAssist: () => void
}

const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial state
  projectId: null,
  terminalSessions: [],
  activeTerminal: null,
  executionStatus: {
    isRunning: false
  },
  loading: false,
  error: null,
  
  // File management state
  files: [],
  currentDir: '/',
  activeFile: null,
  fileContent: '',
  unsavedChanges: false,
  
  // Enhanced IDE state
  openTabs: [],
  activeTabId: null,
  autoSaveEnabled: true,
  aiAssistVisible: false,
  
  // Terminal actions
  initializeWorkspace: async (projectId: string) => {
    set({ loading: true, error: null, projectId })
    
    try {
      // Create default terminal session
      const defaultSession: TerminalSession = {
        id: 'default',
        name: 'Terminal',
        active: true,
        logs: []
      }
      
      set({
        terminalSessions: [defaultSession],
        activeTerminal: 'default',
        loading: false,
        currentDir: '/',
        files: [],
        openTabs: [],
        activeTabId: null
      })
    } catch (error) {
      set({ loading: false, error: 'Failed to initialize workspace' })
    }
  },
  
  createTerminalSession: (name = 'Terminal') => {
    const id = Math.random().toString(36).substr(2, 9)
    const newSession: TerminalSession = {
      id,
      name: `${name} ${get().terminalSessions.length + 1}`,
      active: false,
      logs: []
    }
    
    set((state) => ({
      terminalSessions: [...state.terminalSessions, newSession]
    }))
    
    return id
  },
  
  setActiveTerminal: (sessionId: string) => {
    set((state) => ({
      activeTerminal: sessionId,
      terminalSessions: state.terminalSessions.map(session => ({
        ...session,
        active: session.id === sessionId
      }))
    }))
  },
  
  addTerminalLog: (sessionId: string, log: Omit<TerminalLog, 'id'>) => {
    const logWithId: TerminalLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9)
    }
    
    set((state) => ({
      terminalSessions: state.terminalSessions.map(session =>
        session.id === sessionId
          ? { ...session, logs: [...session.logs, logWithId] }
          : session
      )
    }))
  },
  
  clearTerminalLogs: (sessionId: string) => {
    set((state) => ({
      terminalSessions: state.terminalSessions.map(session =>
        session.id === sessionId
          ? { ...session, logs: [] }
          : session
      )
    }))
  },
  
  executeCommand: async (command: string) => {
    const { projectId, activeTerminal } = get()
    if (!projectId || !activeTerminal) return
    
    set({
      executionStatus: {
        isRunning: true,
        command,
        startTime: new Date().toISOString()
      }
    })
    
    // Add command to terminal log
    get().addTerminalLog(activeTerminal, {
      type: 'info',
      message: `$ ${command}`,
      timestamp: new Date().toISOString()
    })
    
    try {
      const { data } = await apiClient.post(`/projects/${projectId}/execute`, {
        command
      })
      
      // Add output to terminal log
      if (data.output) {
        get().addTerminalLog(activeTerminal, {
          type: 'stdout',
          message: data.output,
          timestamp: new Date().toISOString()
        })
      }
      
      set({
        executionStatus: {
          isRunning: false,
          exitCode: data.exitCode || 0
        }
      })
    } catch (error: any) {
      get().addTerminalLog(activeTerminal, {
        type: 'error',
        message: error.message || 'Command execution failed',
        timestamp: new Date().toISOString()
      })
      
      set({
        executionStatus: {
          isRunning: false,
          exitCode: 1
        }
      })
    }
  },
  
  stopExecution: async () => {
    const { projectId } = get()
    if (!projectId) return
    
    try {
      await apiClient.post(`/projects/${projectId}/stop-execution`)
      
      set({
        executionStatus: {
          isRunning: false,
          exitCode: 130 // SIGINT
        }
      })
    } catch (error) {
      console.error('Failed to stop execution:', error)
    }
  },
  
  clearWorkspace: () => {
    set({
      projectId: null,
      terminalSessions: [],
      activeTerminal: null,
      executionStatus: {
        isRunning: false
      },
      loading: false,
      error: null,
      files: [],
      currentDir: '/',
      activeFile: null,
      fileContent: '',
      unsavedChanges: false,
      openTabs: [],
      activeTabId: null,
      aiAssistVisible: false
    })
  },
  
  // File management actions
  setFiles: (files: FileItem[]) => {
    set({ files })
  },
  
  setCurrentDir: (dir: string) => {
    set({ currentDir: dir })
  },
  
  setActiveFile: (filePath: string | null) => {
    set({ activeFile: filePath })
  },
  
  setFileContent: (content: string) => {
    set({ fileContent: content })
  },
  
  markUnsaved: (unsaved: boolean) => {
    set({ unsavedChanges: unsaved })
  },
  
  // Enhanced IDE actions
  openTab: (filePath: string, content: string) => {
    const { openTabs } = get()
    const existingTab = openTabs.find(tab => tab.filePath === filePath)
    
    if (existingTab) {
      // Switch to existing tab
      set({ activeTabId: existingTab.id })
      return
    }
    
    // Create new tab
    const fileName = filePath.split('/').pop() || filePath
    const language = getLanguageFromFileName(fileName)
    const newTab: OpenTab = {
      id: Math.random().toString(36).substr(2, 9),
      filePath,
      fileName,
      content,
      isDirty: false,
      language
    }
    
    set((state) => ({
      openTabs: [...state.openTabs, newTab],
      activeTabId: newTab.id,
      activeFile: filePath,
      fileContent: content
    }))
  },
  
  closeTab: (tabId: string) => {
    const { openTabs, activeTabId } = get()
    const updatedTabs = openTabs.filter(tab => tab.id !== tabId)
    
    let newActiveTabId = activeTabId
    if (activeTabId === tabId) {
      // If closing active tab, switch to the last remaining tab
      newActiveTabId = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].id : null
    }
    
    const activeTab = updatedTabs.find(tab => tab.id === newActiveTabId)
    
    set({
      openTabs: updatedTabs,
      activeTabId: newActiveTabId,
      activeFile: activeTab?.filePath || null,
      fileContent: activeTab?.content || ''
    })
  },
  
  setActiveTab: (tabId: string) => {
    const { openTabs } = get()
    const tab = openTabs.find(t => t.id === tabId)
    
    if (tab) {
      set({
        activeTabId: tabId,
        activeFile: tab.filePath,
        fileContent: tab.content
      })
    }
  },
  
  updateTabContent: (tabId: string, content: string) => {
    set((state) => ({
      openTabs: state.openTabs.map(tab =>
        tab.id === tabId ? { ...tab, content, isDirty: true } : tab
      ),
      fileContent: state.activeTabId === tabId ? content : state.fileContent
    }))
  },
  
  markTabDirty: (tabId: string, isDirty: boolean) => {
    set((state) => ({
      openTabs: state.openTabs.map(tab =>
        tab.id === tabId ? { ...tab, isDirty } : tab
      )
    }))
  },
  
  toggleAutoSave: () => {
    set((state) => ({ autoSaveEnabled: !state.autoSaveEnabled }))
  },
  
  toggleAIAssist: () => {
    set((state) => ({ aiAssistVisible: !state.aiAssistVisible }))
  }
}))

// Helper function to determine language from file extension
function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'dockerfile': 'dockerfile'
  }
  
  return languageMap[ext || ''] || 'plaintext'
}

export default useWorkspaceStore