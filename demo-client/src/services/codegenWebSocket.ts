// codegenWebSocket.ts
// -------------------
// WebSocket service extension for CodeGen real-time updates
// Handles file generation progress, manifest updates, and retry queue management

import websocketService from './websocket'
import {
  FileGenerationUpdateEvent,
  ManifestUpdateEvent,
  ProgressUpdateEvent,
  RetryQueueUpdateEvent,
  FileStatus
} from '../types/codegen'

export class CodeGenWebSocketService {
  private listeners: Map<string, Set<Function>> = new Map()
  private projectId: string | null = null

  // Initialize WebSocket connection for a specific project
  async initialize(projectId: string): Promise<void> {
    this.projectId = projectId
    
    // Ensure main WebSocket is connected
    if (!websocketService.isConnected()) {
      await websocketService.connect()
    }
    
    // Join project-specific room for CodeGen updates
    websocketService.joinProjectRoom(projectId)
    
    // Set up event listeners
    this.setupEventListeners()
  }

  // Clean up WebSocket listeners
  cleanup(): void {
    if (this.projectId) {
      websocketService.leaveProjectRoom(this.projectId)
    }
    
    // Remove all listeners
    this.listeners.clear()
    this.projectId = null
  }

  // Subscribe to file generation updates
  onFileGenerationUpdate(callback: (event: FileGenerationUpdateEvent) => void): () => void {
    const eventType = 'file_generation_update'
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  // Subscribe to manifest updates
  onManifestUpdate(callback: (event: ManifestUpdateEvent) => void): () => void {
    const eventType = 'manifest_update'
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  // Subscribe to progress updates
  onProgressUpdate(callback: (event: ProgressUpdateEvent) => void): () => void {
    const eventType = 'progress_update'
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  // Subscribe to retry queue updates
  onRetryQueueUpdate(callback: (event: RetryQueueUpdateEvent) => void): () => void {
    const eventType = 'retry_queue_update'
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  // Request real-time status for a specific file
  requestFileStatus(filePath: string): void {
    if (!this.projectId) return
    
    websocketService.emit('request_file_status', {
      projectId: this.projectId,
      filePath
    })
  }

  // Request full manifest refresh
  requestManifestRefresh(): void {
    if (!this.projectId) return
    
    websocketService.emit('request_manifest_refresh', {
      projectId: this.projectId
    })
  }

  // Request progress update
  requestProgressUpdate(): void {
    if (!this.projectId) return
    
    websocketService.emit('request_progress_update', {
      projectId: this.projectId
    })
  }

  // Set up WebSocket event listeners
  private setupEventListeners(): void {
    // File generation updates
    websocketService.onFileGenerationUpdate((data: any) => {
      if (data.projectId !== this.projectId) return
      
      const event: FileGenerationUpdateEvent = {
        type: 'file_generation_update',
        projectId: data.projectId,
        filePath: data.filePath,
        status: data.status as FileStatus,
        error: data.error,
        progress: data.progress,
        metadata: data.metadata
      }
      
      this.notifyListeners('file_generation_update', event)
    })

    // Manifest updates
    const unsubscribeManifest = websocketService.onWorkflowUpdate((data: any) => {
      if (data.type === 'manifest_update' && data.projectId === this.projectId) {
        const event: ManifestUpdateEvent = {
          type: 'manifest_update',
          projectId: data.projectId,
          manifest: data.manifest,
          validationResult: data.validationResult
        }
        
        this.notifyListeners('manifest_update', event)
      }
    })

    // Progress updates
    const unsubscribeProgress = websocketService.onWorkflowUpdate((data: any) => {
      if (data.type === 'progress_update' && data.projectId === this.projectId) {
        const event: ProgressUpdateEvent = {
          type: 'progress_update',
          projectId: data.projectId,
          progress: data.progress,
          currentFile: data.currentFile
        }
        
        this.notifyListeners('progress_update', event)
      }
    })

    // Retry queue updates
    const unsubscribeRetry = websocketService.onWorkflowUpdate((data: any) => {
      if (data.type === 'retry_queue_update' && data.projectId === this.projectId) {
        const event: RetryQueueUpdateEvent = {
          type: 'retry_queue_update',
          projectId: data.projectId,
          retryQueue: data.retryQueue
        }
        
        this.notifyListeners('retry_queue_update', event)
      }
    })

    // Store cleanup functions (if needed later)
    // Note: In a real implementation, you might want to store these for cleanup
  }

  // Notify all listeners for a specific event type
  private notifyListeners(eventType: string, event: any): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error)
        }
      })
    }
  }

  // Get connection status
  isConnected(): boolean {
    return websocketService.isConnected()
  }

  // Get current project ID
  getCurrentProjectId(): string | null {
    return this.projectId
  }
}

// Create singleton instance
const codegenWebSocketService = new CodeGenWebSocketService()

export default codegenWebSocketService