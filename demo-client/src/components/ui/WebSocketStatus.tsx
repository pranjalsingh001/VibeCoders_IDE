// WebSocketStatus.tsx
// -------------------
// Component for displaying WebSocket connection status
// Shows connection health, reconnection attempts, and project room status

import React from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { cn } from '../../utils/cn'

interface WebSocketStatusProps {
  projectId?: string
  className?: string
  showDetails?: boolean
}

export function WebSocketStatus({ 
  projectId, 
  className,
  showDetails = false 
}: WebSocketStatusProps) {
  const { isConnected, connectionHealth, connect } = useWebSocket({ 
    projectId, 
    autoConnect: true 
  })

  const getStatusColor = () => {
    if (isConnected) return 'text-green-500'
    if (connectionHealth.reconnectAttempts > 0) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStatusText = () => {
    if (isConnected) return 'Connected'
    if (connectionHealth.reconnectAttempts > 0) {
      return `Reconnecting... (${connectionHealth.reconnectAttempts}/${connectionHealth.maxReconnectAttempts})`
    }
    return 'Disconnected'
  }

  const getStatusIcon = () => {
    if (isConnected) {
      return (
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )
    }
    if (connectionHealth.reconnectAttempts > 0) {
      return (
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-spin" />
      )
    }
    return (
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    )
  }

  const handleReconnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Manual reconnection failed:', error)
    }
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {getStatusIcon()}
      
      <span className={cn('text-sm font-medium', getStatusColor())}>
        {getStatusText()}
      </span>

      {!isConnected && connectionHealth.reconnectAttempts === 0 && (
        <button
          onClick={handleReconnect}
          className="text-xs text-blue-500 hover:text-blue-600 underline"
        >
          Retry
        </button>
      )}

      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          {connectionHealth.connectionId && (
            <div>ID: {connectionHealth.connectionId.slice(0, 8)}...</div>
          )}
          {connectionHealth.currentProjectId && (
            <div>Project: {connectionHealth.currentProjectId}</div>
          )}
          {connectionHealth.activeListeners.length > 0 && (
            <div>Listeners: {connectionHealth.activeListeners.length}</div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact status indicator for headers/toolbars
export function WebSocketStatusIndicator({ 
  projectId, 
  className 
}: Pick<WebSocketStatusProps, 'projectId' | 'className'>) {
  const { isConnected, connectionHealth } = useWebSocket({ 
    projectId, 
    autoConnect: true 
  })

  const getIndicatorClass = () => {
    if (isConnected) return 'bg-green-500'
    if (connectionHealth.reconnectAttempts > 0) return 'bg-yellow-500 animate-pulse'
    return 'bg-red-500'
  }

  const getTooltipText = () => {
    if (isConnected) {
      return `Connected to real-time updates${projectId ? ` for project ${projectId}` : ''}`
    }
    if (connectionHealth.reconnectAttempts > 0) {
      return `Reconnecting... (${connectionHealth.reconnectAttempts}/${connectionHealth.maxReconnectAttempts})`
    }
    return 'Disconnected from real-time updates'
  }

  return (
    <div 
      className={cn('w-3 h-3 rounded-full', getIndicatorClass(), className)}
      title={getTooltipText()}
    />
  )
}

// Full status panel for debugging/admin
export function WebSocketStatusPanel({ 
  projectId, 
  className 
}: Pick<WebSocketStatusProps, 'projectId' | 'className'>) {
  const { 
    isConnected, 
    connectionHealth, 
    connect, 
    disconnect,
    requestProjectUpdates 
  } = useWebSocket({ projectId, autoConnect: true })

  const handleRequestUpdates = async () => {
    if (projectId) {
      try {
        await requestProjectUpdates(projectId)
      } catch (error) {
        console.error('Failed to request updates:', error)
      }
    }
  }

  return (
    <div className={cn('bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          WebSocket Status
        </h3>
        <WebSocketStatusIndicator projectId={projectId} />
      </div>

      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={cn('font-medium', isConnected ? 'text-green-600' : 'text-red-600')}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {connectionHealth.connectionId && (
          <div className="flex justify-between">
            <span>Connection ID:</span>
            <span className="font-mono">{connectionHealth.connectionId.slice(0, 12)}...</span>
          </div>
        )}

        {connectionHealth.currentProjectId && (
          <div className="flex justify-between">
            <span>Project Room:</span>
            <span className="font-mono">{connectionHealth.currentProjectId}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Reconnect Attempts:</span>
          <span>{connectionHealth.reconnectAttempts}/{connectionHealth.maxReconnectAttempts}</span>
        </div>

        <div className="flex justify-between">
          <span>Active Listeners:</span>
          <span>{connectionHealth.activeListeners.length}</span>
        </div>

        {connectionHealth.activeListeners.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Event Types:</div>
            <div className="flex flex-wrap gap-1">
              {connectionHealth.activeListeners.map(listener => (
                <span 
                  key={listener}
                  className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {listener}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {!isConnected ? (
          <button
            onClick={connect}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        )}

        {projectId && isConnected && (
          <button
            onClick={handleRequestUpdates}
            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
          >
            Request Updates
          </button>
        )}
      </div>
    </div>
  )
}