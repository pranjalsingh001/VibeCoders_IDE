// websocket.ts
// ------------
// Enhanced WebSocket service for real-time updates across the application
// Supports project-specific rooms, workflow updates, file generation progress, and log streaming

import { io, Socket } from 'socket.io-client'
import useAuthStore from '../stores/authStore'
import useUIStore from '../stores/uiStore'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private currentProjectId: string | null = null
  private eventListeners: Map<string, Set<Function>> = new Map()
  private connectionPromise: Promise<void> | null = null

  // Initialize WebSocket connection with enhanced connection management
  connect(): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Return resolved promise if already connected
    if (this.socket?.connected) {
      return Promise.resolve()
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve()
        return
      }

      this.isConnecting = true
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const token = useAuthStore.getState().token

      if (!token) {
        this.isConnecting = false
        this.connectionPromise = null
        reject(new Error('No authentication token available'))
        return
      }

      this.socket = io(baseURL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5
      })

      // Connection successful
      this.socket.on('connect', () => {
        console.log('WebSocket connected:', this.socket?.id)
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.connectionPromise = null
        
        // Rejoin current project room if we were in one
        if (this.currentProjectId) {
          this.joinProjectRoom(this.currentProjectId)
        }
        
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'success',
          message: 'Connected to real-time updates',
          duration: 3000
        })
        
        resolve()
      })

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        this.isConnecting = false
        this.connectionPromise = null
        
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'error',
          message: 'Failed to connect to real-time updates',
          duration: 5000
        })
        
        reject(error)
      })

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          this.reconnect()
        }
      })

      // Reconnection attempt
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`WebSocket reconnection attempt ${attemptNumber}`)
        this.reconnectAttempts = attemptNumber
        
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'warning',
          message: `Reconnecting... (${attemptNumber}/${this.maxReconnectAttempts})`,
          duration: 2000
        })
      })

      // Reconnection successful
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`)
        this.reconnectAttempts = 0
        
        // Rejoin project room and resubscribe to events
        if (this.currentProjectId) {
          this.joinProjectRoom(this.currentProjectId)
        }
        this.resubscribeEvents()
        
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'success',
          message: 'Reconnected to real-time updates',
          duration: 3000
        })
      })

      // Reconnection failed
      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed')
        
        const uiStore = useUIStore.getState()
        uiStore.addToast({
          type: 'error',
          message: 'Failed to reconnect. Please refresh the page.',
          duration: 0, // Don't auto-dismiss
          actions: [
            {
              label: 'Refresh',
              onClick: () => window.location.reload(),
              variant: 'primary'
            }
          ]
        })
      })
    })
  }

  // Disconnect WebSocket with cleanup
  disconnect(): void {
    if (this.socket) {
      // Leave current project room before disconnecting
      if (this.currentProjectId) {
        this.leaveProjectRoom(this.currentProjectId)
      }
      
      this.socket.disconnect()
      this.socket = null
    }
    this.reconnectAttempts = 0
    this.isConnecting = false
    this.currentProjectId = null
    this.connectionPromise = null
    this.eventListeners.clear()
  }

  // Manual reconnection
  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.connect().catch(console.error)
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
    }
  }

  // Join a project room for project-specific updates
  joinProjectRoom(projectId: string): void {
    // Leave current project room if different
    if (this.currentProjectId && this.currentProjectId !== projectId) {
      this.leaveProjectRoom(this.currentProjectId)
    }

    this.currentProjectId = projectId

    if (this.socket?.connected) {
      this.socket.emit('join-project', projectId)
      console.log(`Joined project room: ${projectId}`)
    } else {
      // Store project ID to rejoin after connection
      console.log(`Stored project ID for later join: ${projectId}`)
    }
  }

  // Leave a project room
  leaveProjectRoom(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-project', projectId)
      console.log(`Left project room: ${projectId}`)
    }
    
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null
    }
  }

  // Enhanced event subscription with automatic cleanup and reconnection handling
  private subscribe(eventName: string, callback: Function): () => void {
    // Add to listeners map for reconnection handling
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set())
    }
    this.eventListeners.get(eventName)!.add(callback)

    // Subscribe to socket event if connected
    if (this.socket?.connected) {
      this.socket.on(eventName, callback as any)
    }

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventName)?.delete(callback)
      this.socket?.off(eventName, callback as any)
    }
  }

  // Re-subscribe to all events after reconnection
  private resubscribeEvents(): void {
    if (!this.socket?.connected) return

    this.eventListeners.forEach((callbacks, eventName) => {
      callbacks.forEach(callback => {
        this.socket!.on(eventName, callback as any)
      })
    })
  }

  // Subscribe to workflow stage updates
  onWorkflowStageUpdate(callback: (data: WorkflowStageUpdateData) => void): () => void {
    return this.subscribe('workflow-stage-update', callback)
  }

  // Subscribe to workflow status updates
  onWorkflowStatusUpdate(callback: (data: WorkflowStatusUpdateData) => void): () => void {
    return this.subscribe('workflow-status-update', callback)
  }

  // Subscribe to file generation updates
  onFileGenerationUpdate(callback: (data: FileGenerationUpdateData) => void): () => void {
    return this.subscribe('file-generation-update', callback)
  }

  // Subscribe to file generation progress updates
  onFileGenerationProgress(callback: (data: FileGenerationProgressData) => void): () => void {
    return this.subscribe('file-generation-progress', callback)
  }

  // Subscribe to code execution logs
  onExecutionLog(callback: (data: ExecutionLogData) => void): () => void {
    return this.subscribe('execution-log', callback)
  }

  // Subscribe to project status updates
  onProjectStatusUpdate(callback: (data: ProjectStatusUpdateData) => void): () => void {
    return this.subscribe('project-status-update', callback)
  }

  // Subscribe to manifest updates
  onManifestUpdate(callback: (data: ManifestUpdateData) => void): () => void {
    return this.subscribe('manifest-update', callback)
  }

  // Subscribe to retry queue updates
  onRetryQueueUpdate(callback: (data: RetryQueueUpdateData) => void): () => void {
    return this.subscribe('retry-queue-update', callback)
  }

  // Subscribe to connection status changes
  onConnectionStatusChange(callback: (data: ConnectionStatusData) => void): () => void {
    return this.subscribe('connection-status-change', callback)
  }

  // Send a message to the server with automatic retry
  emit(event: string, data?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.socket.emit(event, data, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error))
          } else {
            resolve()
          }
        })
      } else {
        // Try to connect first, then emit
        this.connect()
          .then(() => {
            if (this.socket?.connected) {
              this.socket.emit(event, data, (response: any) => {
                if (response?.error) {
                  reject(new Error(response.error))
                } else {
                  resolve()
                }
              })
            } else {
              reject(new Error(`Cannot emit ${event}: WebSocket not connected`))
            }
          })
          .catch(reject)
      }
    })
  }

  // Request real-time updates for a specific project
  requestProjectUpdates(projectId: string): Promise<void> {
    return this.emit('request-project-updates', { projectId })
  }

  // Request file generation status
  requestFileGenerationStatus(projectId: string, filePath?: string): Promise<void> {
    return this.emit('request-file-generation-status', { projectId, filePath })
  }

  // Request execution logs
  requestExecutionLogs(projectId: string, fromTimestamp?: string): Promise<void> {
    return this.emit('request-execution-logs', { projectId, fromTimestamp })
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Get connection ID
  getConnectionId(): string | undefined {
    return this.socket?.id
  }

  // Get current project ID
  getCurrentProjectId(): string | null {
    return this.currentProjectId
  }

  // Get connection health info
  getConnectionHealth(): ConnectionHealth {
    return {
      isConnected: this.isConnected(),
      connectionId: this.getConnectionId(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      currentProjectId: this.currentProjectId,
      activeListeners: Array.from(this.eventListeners.keys())
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService()

export default websocketService

// Enhanced type definitions for WebSocket events
export interface WorkflowStageUpdateData {
  projectId: string
  stage: string
  previousStage?: string
  timestamp: string
  metadata?: any
}

export interface WorkflowStatusUpdateData {
  projectId: string
  stage: string
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  previousStatus?: string
  timestamp: string
  data?: any
}

export interface FileGenerationUpdateData {
  projectId: string
  filePath: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  error?: string
  content?: string
  attempts: number
  timestamp: string
  metadata?: {
    size?: number
    language?: string
    dependencies?: string[]
  }
}

export interface FileGenerationProgressData {
  projectId: string
  totalFiles: number
  completedFiles: number
  failedFiles: number
  inProgressFiles: number
  pendingFiles: number
  percentage: number
  currentFile?: string
  estimatedTimeRemaining?: number
  timestamp: string
}

export interface ExecutionLogData {
  projectId: string
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'debug'
  message: string
  timestamp: string
  source?: string
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  metadata?: any
}

export interface ProjectStatusUpdateData {
  projectId: string
  status: string
  previousStatus?: string
  timestamp: string
  metadata?: any
}

export interface ManifestUpdateData {
  projectId: string
  manifest: {
    id: string
    files: Array<{
      path: string
      status: string
      error?: string
    }>
    totalFiles: number
    completedFiles: number
    failedFiles: number
  }
  validationResult?: {
    isValid: boolean
    errors: Array<{
      type: string
      message: string
      severity: string
    }>
  }
  timestamp: string
}

export interface RetryQueueUpdateData {
  projectId: string
  retryQueue: Array<{
    filePath: string
    attempts: number
    lastError?: string
    nextRetryAt?: string
    priority: string
  }>
  timestamp: string
}

export interface ConnectionStatusData {
  isConnected: boolean
  connectionId?: string
  timestamp: string
  reason?: string
}

export interface ConnectionHealth {
  isConnected: boolean
  connectionId?: string
  reconnectAttempts: number
  maxReconnectAttempts: number
  currentProjectId: string | null
  activeListeners: string[]
}