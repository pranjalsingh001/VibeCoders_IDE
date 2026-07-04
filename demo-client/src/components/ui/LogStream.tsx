// LogStream.tsx
// -------------
// Real-time log streaming component
// Displays execution logs with filtering, search, and auto-scroll

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useExecutionLogs } from '../../hooks/useWebSocket'
import { ExecutionLogData } from '../../services/websocket'
import { cn } from '../../utils/cn'

interface LogEntry extends ExecutionLogData {
  id: string
}

interface LogStreamProps {
  projectId: string | null
  className?: string
  maxLogs?: number
  autoScroll?: boolean
  showTimestamps?: boolean
  showSources?: boolean
  filterLevels?: string[]
}

export function LogStream({
  projectId,
  className,
  maxLogs = 1000,
  autoScroll = true,
  showTimestamps = true,
  showSources = true,
  filterLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
}: LogStreamProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(filterLevels))
  const [isPaused, setIsPaused] = useState(false)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(autoScroll)
  
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Handle new log entries
  const handleNewLog = useCallback((logData: ExecutionLogData) => {
    if (isPaused) return

    const logEntry: LogEntry = {
      ...logData,
      id: `${logData.timestamp}-${Math.random().toString(36).substr(2, 9)}`
    }

    setLogs(prevLogs => {
      const newLogs = [...prevLogs, logEntry]
      // Keep only the most recent logs
      if (newLogs.length > maxLogs) {
        return newLogs.slice(-maxLogs)
      }
      return newLogs
    })
  }, [isPaused, maxLogs])

  // Subscribe to execution logs
  useExecutionLogs(projectId, handleNewLog)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScrollEnabled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScrollEnabled])

  // Filter logs based on search term and selected levels
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.source && log.source.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesLevel = selectedLevels.has(log.level || log.type)
    
    return matchesSearch && matchesLevel
  })

  // Get log level color
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
      case 'fatal':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      case 'debug':
        return 'text-gray-500'
      case 'trace':
        return 'text-gray-400'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  // Get log type icon
  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warn':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      case 'debug':
        return '🐛'
      case 'stdout':
        return '📤'
      case 'stderr':
        return '📥'
      default:
        return '📝'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Toggle level filter
  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(level)) {
        newSet.delete(level)
      } else {
        newSet.add(level)
      }
      return newSet
    })
  }

  // Clear logs
  const clearLogs = () => {
    setLogs([])
  }

  // Handle scroll to detect manual scrolling
  const handleScroll = () => {
    if (!logsContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    
    setAutoScrollEnabled(isAtBottom)
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-900 text-gray-100', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium">Execution Logs</h3>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Level filters */}
          <div className="flex space-x-1">
            {['error', 'warn', 'info', 'debug'].map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  selectedLevels.has(level)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              'px-3 py-1 text-xs rounded',
              isPaused
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            )}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
            className={cn(
              'px-3 py-1 text-xs rounded',
              autoScrollEnabled
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 hover:bg-gray-700'
            )}
          >
            Auto-scroll: {autoScrollEnabled ? 'On' : 'Off'}
          </button>

          <button
            onClick={clearLogs}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
          >
            Clear
          </button>

          <div className="text-xs text-gray-400">
            {filteredLogs.length} / {logs.length} logs
          </div>
        </div>
      </div>

      {/* Logs container */}
      <div 
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {logs.length === 0 ? 'No logs yet...' : 'No logs match current filters'}
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="flex items-start space-x-2 py-1 px-2 hover:bg-gray-800 rounded"
            >
              {/* Icon */}
              <span className="flex-shrink-0 mt-0.5">
                {getLogTypeIcon(log.type)}
              </span>

              {/* Timestamp */}
              {showTimestamps && (
                <span className="flex-shrink-0 text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </span>
              )}

              {/* Level */}
              <span className={cn('flex-shrink-0 font-medium', getLogLevelColor(log.level || log.type))}>
                {(log.level || log.type).toUpperCase()}
              </span>

              {/* Source */}
              {showSources && log.source && (
                <span className="flex-shrink-0 text-gray-400">
                  [{log.source}]
                </span>
              )}

              {/* Message */}
              <span className="flex-1 break-words">
                {log.message}
              </span>
            </div>
          ))
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div>
          {isPaused && (
            <span className="text-yellow-400">⏸️ Paused</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {!autoScrollEnabled && (
            <button
              onClick={() => {
                setAutoScrollEnabled(true)
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Scroll to bottom
            </button>
          )}
          
          <span>
            Project: {projectId || 'None'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Compact log viewer for smaller spaces
export function CompactLogStream({
  projectId,
  className,
  maxLogs = 100
}: Pick<LogStreamProps, 'projectId' | 'className' | 'maxLogs'>) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleNewLog = useCallback((logData: ExecutionLogData) => {
    const logEntry: LogEntry = {
      ...logData,
      id: `${logData.timestamp}-${Math.random().toString(36).substr(2, 9)}`
    }

    setLogs(prevLogs => {
      const newLogs = [...prevLogs, logEntry]
      if (newLogs.length > maxLogs) {
        return newLogs.slice(-maxLogs)
      }
      return newLogs
    })
  }, [maxLogs])

  useExecutionLogs(projectId, handleNewLog)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className={cn('bg-gray-900 text-gray-100 rounded border', className)}>
      <div className="p-2 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300">Recent Logs</h4>
      </div>
      
      <div className="h-32 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {logs.slice(-10).map(log => (
          <div key={log.id} className="flex items-center space-x-2">
            <span className={cn('font-medium', getLogLevelColor(log.level || log.type))}>
              {(log.level || log.type).charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// Helper function for compact log viewer
function getLogLevelColor(level: string) {
  switch (level) {
    case 'error':
    case 'fatal':
      return 'text-red-400'
    case 'warn':
      return 'text-yellow-400'
    case 'info':
      return 'text-blue-400'
    case 'debug':
      return 'text-gray-400'
    default:
      return 'text-gray-300'
  }
}