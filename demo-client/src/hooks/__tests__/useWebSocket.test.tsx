// useWebSocket.test.tsx
// ---------------------
// Tests for WebSocket hooks and real-time functionality

import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useWebSocket, useRealTimeUpdates } from '../useWebSocket'
import websocketService from '../../services/websocket'

// Mock the WebSocket service
vi.mock('../../services/websocket', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    joinProjectRoom: vi.fn(),
    leaveProjectRoom: vi.fn(),
    requestProjectUpdates: vi.fn(),
    requestFileGenerationStatus: vi.fn(),
    requestExecutionLogs: vi.fn(),
    getConnectionHealth: vi.fn(),
    onWorkflowStageUpdate: vi.fn(),
    onWorkflowStatusUpdate: vi.fn(),
    onFileGenerationUpdate: vi.fn(),
    onFileGenerationProgress: vi.fn(),
    onExecutionLog: vi.fn(),
    onManifestUpdate: vi.fn(),
    onRetryQueueUpdate: vi.fn(),
    onConnectionStatusChange: vi.fn()
  }
}))

const mockWebSocketService = vi.mocked(websocketService)

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWebSocketService.isConnected.mockReturnValue(false)
    mockWebSocketService.getConnectionHealth.mockReturnValue({
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      currentProjectId: null,
      activeListeners: []
    })
    mockWebSocketService.connect.mockResolvedValue()
    mockWebSocketService.onConnectionStatusChange.mockReturnValue(() => {})
  })

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useWebSocket())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.connectionHealth.isConnected).toBe(false)
    expect(mockWebSocketService.connect).toHaveBeenCalled()
  })

  it('should connect to WebSocket with projectId', async () => {
    const projectId = 'test-project-123'
    
    const { result } = renderHook(() => useWebSocket({ 
      projectId, 
      autoConnect: true 
    }))

    expect(mockWebSocketService.connect).toHaveBeenCalled()
    expect(mockWebSocketService.joinProjectRoom).toHaveBeenCalledWith(projectId)
  })

  it('should handle manual connect and disconnect', async () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }))

    await act(async () => {
      await result.current.connect()
    })

    expect(mockWebSocketService.connect).toHaveBeenCalled()

    act(() => {
      result.current.disconnect()
    })

    expect(mockWebSocketService.disconnect).toHaveBeenCalled()
  })

  it('should join and leave project rooms', () => {
    const projectId = 'test-project-123'
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }))

    act(() => {
      result.current.joinProject(projectId)
    })

    expect(mockWebSocketService.joinProjectRoom).toHaveBeenCalledWith(projectId)

    act(() => {
      result.current.leaveProject(projectId)
    })

    expect(mockWebSocketService.leaveProjectRoom).toHaveBeenCalledWith(projectId)
  })

  it('should request project updates', async () => {
    const projectId = 'test-project-123'
    mockWebSocketService.requestProjectUpdates.mockResolvedValue()
    
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      await result.current.requestProjectUpdates(projectId)
    })

    expect(mockWebSocketService.requestProjectUpdates).toHaveBeenCalledWith(projectId)
  })

  it('should request file generation status', async () => {
    const projectId = 'test-project-123'
    const filePath = 'src/App.tsx'
    mockWebSocketService.requestFileGenerationStatus.mockResolvedValue()
    
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      await result.current.requestFileGenerationStatus(projectId, filePath)
    })

    expect(mockWebSocketService.requestFileGenerationStatus).toHaveBeenCalledWith(projectId, filePath)
  })

  it('should request execution logs', async () => {
    const projectId = 'test-project-123'
    const fromTimestamp = '2024-01-01T00:00:00Z'
    mockWebSocketService.requestExecutionLogs.mockResolvedValue()
    
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      await result.current.requestExecutionLogs(projectId, fromTimestamp)
    })

    expect(mockWebSocketService.requestExecutionLogs).toHaveBeenCalledWith(projectId, fromTimestamp)
  })
})

describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWebSocketService.isConnected.mockReturnValue(true)
    mockWebSocketService.getConnectionHealth.mockReturnValue({
      isConnected: true,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      currentProjectId: 'test-project-123',
      activeListeners: ['workflow-stage-update', 'file-generation-update']
    })
    mockWebSocketService.connect.mockResolvedValue()
    mockWebSocketService.onConnectionStatusChange.mockReturnValue(() => {})
    mockWebSocketService.onWorkflowStageUpdate.mockReturnValue(() => {})
    mockWebSocketService.onWorkflowStatusUpdate.mockReturnValue(() => {})
    mockWebSocketService.onFileGenerationUpdate.mockReturnValue(() => {})
    mockWebSocketService.onFileGenerationProgress.mockReturnValue(() => {})
    mockWebSocketService.onExecutionLog.mockReturnValue(() => {})
    mockWebSocketService.onManifestUpdate.mockReturnValue(() => {})
    mockWebSocketService.onRetryQueueUpdate.mockReturnValue(() => {})
  })

  it('should subscribe to all real-time updates', () => {
    const projectId = 'test-project-123'
    const callbacks = {
      onWorkflowStageUpdate: vi.fn(),
      onWorkflowStatusUpdate: vi.fn(),
      onFileGenerationUpdate: vi.fn(),
      onFileGenerationProgress: vi.fn(),
      onExecutionLog: vi.fn(),
      onManifestUpdate: vi.fn(),
      onRetryQueueUpdate: vi.fn()
    }

    renderHook(() => useRealTimeUpdates(projectId, callbacks))

    expect(mockWebSocketService.onWorkflowStageUpdate).toHaveBeenCalled()
    expect(mockWebSocketService.onWorkflowStatusUpdate).toHaveBeenCalled()
    expect(mockWebSocketService.onFileGenerationUpdate).toHaveBeenCalled()
    expect(mockWebSocketService.onFileGenerationProgress).toHaveBeenCalled()
    expect(mockWebSocketService.onExecutionLog).toHaveBeenCalled()
    expect(mockWebSocketService.onManifestUpdate).toHaveBeenCalled()
    expect(mockWebSocketService.onRetryQueueUpdate).toHaveBeenCalled()
  })

  it('should handle null projectId gracefully', () => {
    // Override mock for this specific test
    mockWebSocketService.isConnected.mockReturnValue(false)
    mockWebSocketService.getConnectionHealth.mockReturnValue({
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      currentProjectId: null,
      activeListeners: []
    })

    const callbacks = {
      onWorkflowStageUpdate: vi.fn()
    }

    const { result } = renderHook(() => useRealTimeUpdates(null, callbacks))

    // Should not throw errors and should return WebSocket connection info
    expect(result.current.isConnected).toBe(false)
    expect(result.current.connectionHealth).toBeDefined()
    expect(result.current.connectionHealth.currentProjectId).toBe(null)
  })

  it('should return WebSocket connection info', () => {
    const projectId = 'test-project-123'
    const { result } = renderHook(() => useRealTimeUpdates(projectId, {}))

    expect(result.current.isConnected).toBe(true)
    expect(result.current.connectionHealth.currentProjectId).toBe(projectId)
    expect(result.current.connectionHealth.activeListeners).toContain('workflow-stage-update')
  })
})

describe('WebSocket Integration', () => {
  it('should handle connection errors gracefully', async () => {
    const connectionError = new Error('Connection failed')
    mockWebSocketService.connect.mockRejectedValue(connectionError)
    
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }))

    await act(async () => {
      try {
        await result.current.connect()
      } catch (error) {
        expect(error).toBe(connectionError)
      }
    })

    expect(mockWebSocketService.connect).toHaveBeenCalled()
  })

  it('should handle request failures gracefully', async () => {
    const requestError = new Error('Request failed')
    mockWebSocketService.requestProjectUpdates.mockRejectedValue(requestError)
    
    const { result } = renderHook(() => useWebSocket())

    // Should not throw, but log error internally
    await act(async () => {
      await result.current.requestProjectUpdates('test-project')
    })

    expect(mockWebSocketService.requestProjectUpdates).toHaveBeenCalledWith('test-project')
  })

  it('should clean up subscriptions on unmount', () => {
    const unsubscribeFn = vi.fn()
    mockWebSocketService.onWorkflowStageUpdate.mockReturnValue(unsubscribeFn)
    
    const { unmount } = renderHook(() => useRealTimeUpdates('test-project', {
      onWorkflowStageUpdate: vi.fn()
    }))

    unmount()

    expect(unsubscribeFn).toHaveBeenCalled()
  })
})