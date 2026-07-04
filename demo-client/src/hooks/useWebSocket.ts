// useWebSocket.ts
// ---------------
// React hook for WebSocket real-time updates
// Provides easy-to-use interface for components to subscribe to WebSocket events

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import websocketService, {
  WorkflowStageUpdateData,
  WorkflowStatusUpdateData,
  FileGenerationUpdateData,
  FileGenerationProgressData,
  ExecutionLogData,
  ProjectStatusUpdateData,
  ManifestUpdateData,
  RetryQueueUpdateData,
  ConnectionStatusData,
  ConnectionHealth
} from '../services/websocket'

export interface UseWebSocketOptions {
  projectId?: string
  autoConnect?: boolean
  reconnectOnProjectChange?: boolean
}

export interface UseWebSocketReturn {
  isConnected: boolean
  connectionHealth: ConnectionHealth
  connect: () => Promise<void>
  disconnect: () => void
  joinProject: (projectId: string) => void
  leaveProject: (projectId: string) => void
  requestProjectUpdates: (projectId: string) => Promise<void>
  requestFileGenerationStatus: (projectId: string, filePath?: string) => Promise<void>
  requestExecutionLogs: (projectId: string, fromTimestamp?: string) => Promise<void>
}

// Main WebSocket hook
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { projectId, autoConnect = true, reconnectOnProjectChange = true } = options
  const [isConnected, setIsConnected] = useState(websocketService.isConnected())
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>(
    websocketService.getConnectionHealth()
  )
  const currentProjectRef = useRef<string | null>(null)

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    setIsConnected(websocketService.isConnected())
    setConnectionHealth(websocketService.getConnectionHealth())
  }, [])

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await websocketService.connect()
      updateConnectionStatus()
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      updateConnectionStatus()
    }
  }, [updateConnectionStatus])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect()
    updateConnectionStatus()
  }, [updateConnectionStatus])

  // Join project room
  const joinProject = useCallback((projectId: string) => {
    websocketService.joinProjectRoom(projectId)
    currentProjectRef.current = projectId
    updateConnectionStatus()
  }, [updateConnectionStatus])

  // Leave project room
  const leaveProject = useCallback((projectId: string) => {
    websocketService.leaveProjectRoom(projectId)
    if (currentProjectRef.current === projectId) {
      currentProjectRef.current = null
    }
    updateConnectionStatus()
  }, [updateConnectionStatus])

  // Request project updates
  const requestProjectUpdates = useCallback(async (projectId: string) => {
    try {
      await websocketService.requestProjectUpdates(projectId)
    } catch (error) {
      console.error('Failed to request project updates:', error)
    }
  }, [])

  // Request file generation status
  const requestFileGenerationStatus = useCallback(async (projectId: string, filePath?: string) => {
    try {
      await websocketService.requestFileGenerationStatus(projectId, filePath)
    } catch (error) {
      console.error('Failed to request file generation status:', error)
    }
  }, [])

  // Request execution logs
  const requestExecutionLogs = useCallback(async (projectId: string, fromTimestamp?: string) => {
    try {
      await websocketService.requestExecutionLogs(projectId, fromTimestamp)
    } catch (error) {
      console.error('Failed to request execution logs:', error)
    }
  }, [])

  // Auto-connect and project management
  useEffect(() => {
    if (autoConnect && !isConnected) {
      connect()
    }

    // Join project room if specified
    if (projectId && projectId !== currentProjectRef.current) {
      if (reconnectOnProjectChange || !currentProjectRef.current) {
        joinProject(projectId)
      }
    }

    // Subscribe to connection status changes
    const unsubscribe = websocketService.onConnectionStatusChange((data: ConnectionStatusData) => {
      updateConnectionStatus()
    })

    return () => {
      unsubscribe()
    }
  }, [projectId, autoConnect, reconnectOnProjectChange, isConnected, connect, joinProject, updateConnectionStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentProjectRef.current) {
        leaveProject(currentProjectRef.current)
      }
    }
  }, [leaveProject])

  // Memoize the return object to prevent infinite re-renders
  return useMemo(() => ({
    isConnected,
    connectionHealth,
    connect,
    disconnect,
    joinProject,
    leaveProject,
    requestProjectUpdates,
    requestFileGenerationStatus,
    requestExecutionLogs
  }), [
    isConnected,
    connectionHealth,
    connect,
    disconnect,
    joinProject,
    leaveProject,
    requestProjectUpdates,
    requestFileGenerationStatus,
    requestExecutionLogs
  ])
}

// Hook for workflow stage updates
export function useWorkflowStageUpdates(
  projectId: string | null,
  onUpdate: (data: WorkflowStageUpdateData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Subscribe to workflow stage updates
    unsubscribeRef.current = websocketService.onWorkflowStageUpdate((data) => {
      if (data.projectId === projectId) {
        onUpdate(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onUpdate])
}

// Hook for workflow status updates
export function useWorkflowStatusUpdates(
  projectId: string | null,
  onUpdate: (data: WorkflowStatusUpdateData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = websocketService.onWorkflowStatusUpdate((data) => {
      if (data.projectId === projectId) {
        onUpdate(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onUpdate])
}

// Hook for file generation updates
export function useFileGenerationUpdates(
  projectId: string | null,
  onUpdate: (data: FileGenerationUpdateData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = websocketService.onFileGenerationUpdate((data) => {
      if (data.projectId === projectId) {
        onUpdate(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onUpdate])
}

// Hook for file generation progress
export function useFileGenerationProgress(
  projectId: string | null,
  onProgress: (data: FileGenerationProgressData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = websocketService.onFileGenerationProgress((data) => {
      if (data.projectId === projectId) {
        onProgress(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onProgress])
}

// Hook for execution logs
export function useExecutionLogs(
  projectId: string | null,
  onLog: (data: ExecutionLogData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = websocketService.onExecutionLog((data) => {
      if (data.projectId === projectId) {
        onLog(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onLog])
}

// Hook for manifest updates
export function useManifestUpdates(
  projectId: string | null,
  onUpdate: (data: ManifestUpdateData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = websocketService.onManifestUpdate((data) => {
      if (data.projectId === projectId) {
        onUpdate(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onUpdate])
}

// Hook for retry queue updates
export function useRetryQueueUpdates(
  projectId: string | null,
  onUpdate: (data: RetryQueueUpdateData) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = websocketService.onRetryQueueUpdate((data) => {
      if (data.projectId === projectId) {
        onUpdate(data)
      }
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [projectId, onUpdate])
}

// Combined hook for all real-time updates
export interface UseRealTimeUpdatesCallbacks {
  onWorkflowStageUpdate?: (data: WorkflowStageUpdateData) => void
  onWorkflowStatusUpdate?: (data: WorkflowStatusUpdateData) => void
  onFileGenerationUpdate?: (data: FileGenerationUpdateData) => void
  onFileGenerationProgress?: (data: FileGenerationProgressData) => void
  onExecutionLog?: (data: ExecutionLogData) => void
  onManifestUpdate?: (data: ManifestUpdateData) => void
  onRetryQueueUpdate?: (data: RetryQueueUpdateData) => void
}

export function useRealTimeUpdates(
  projectId: string | null,
  callbacks: UseRealTimeUpdatesCallbacks
) {
  const webSocket = useWebSocket({ projectId, autoConnect: true })

  useWorkflowStageUpdates(projectId, callbacks.onWorkflowStageUpdate || (() => {}))
  useWorkflowStatusUpdates(projectId, callbacks.onWorkflowStatusUpdate || (() => {}))
  useFileGenerationUpdates(projectId, callbacks.onFileGenerationUpdate || (() => {}))
  useFileGenerationProgress(projectId, callbacks.onFileGenerationProgress || (() => {}))
  useExecutionLogs(projectId, callbacks.onExecutionLog || (() => {}))
  useManifestUpdates(projectId, callbacks.onManifestUpdate || (() => {}))
  useRetryQueueUpdates(projectId, callbacks.onRetryQueueUpdate || (() => {}))

  return webSocket
}