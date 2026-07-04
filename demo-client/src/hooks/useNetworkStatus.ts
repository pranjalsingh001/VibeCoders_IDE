// useNetworkStatus.ts
// -------------------
// Hook for monitoring network status and connection quality
// Provides offline detection and graceful degradation capabilities

import { useState, useEffect, useCallback } from 'react'
import useUIStore from '../stores/uiStore'

export interface NetworkStatus {
  isOnline: boolean
  isConnected: boolean
  connectionQuality: 'good' | 'poor' | 'offline'
  lastConnected: Date | null
  retryCount: number
}

interface UseNetworkStatusOptions {
  pingInterval?: number
  pingTimeout?: number
  maxRetries?: number
  onStatusChange?: (status: NetworkStatus) => void
}

const DEFAULT_OPTIONS: Required<UseNetworkStatusOptions> = {
  pingInterval: 30000, // 30 seconds
  pingTimeout: 5000,   // 5 seconds
  maxRetries: 3,
  onStatusChange: () => {}
}

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { addToast } = useUIStore()
  
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnected: navigator.onLine,
    connectionQuality: navigator.onLine ? 'good' : 'offline',
    lastConnected: navigator.onLine ? new Date() : null,
    retryCount: 0
  })

  // Ping server to check actual connectivity
  const pingServer = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), opts.pingTimeout)
      
      const response = await fetch('/api/v1/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.warn('Server ping failed:', error)
      return false
    }
  }, [opts.pingTimeout])

  // Measure connection quality
  const measureConnectionQuality = useCallback(async (): Promise<'good' | 'poor'> => {
    const startTime = performance.now()
    const isConnected = await pingServer()
    const endTime = performance.now()
    const latency = endTime - startTime

    if (!isConnected) return 'poor'
    
    // Consider connection quality based on latency
    if (latency < 1000) return 'good'
    return 'poor'
  }, [pingServer])

  // Update network status
  const updateStatus = useCallback(async (isOnline: boolean) => {
    let newStatus: NetworkStatus = {
      ...status,
      isOnline
    }

    if (isOnline) {
      const quality = await measureConnectionQuality()
      const isConnected = quality !== 'poor' || await pingServer()
      
      newStatus = {
        ...newStatus,
        isConnected,
        connectionQuality: isConnected ? quality : 'poor',
        lastConnected: isConnected ? new Date() : status.lastConnected,
        retryCount: isConnected ? 0 : status.retryCount
      }
    } else {
      newStatus = {
        ...newStatus,
        isConnected: false,
        connectionQuality: 'offline',
        retryCount: status.retryCount + 1
      }
    }

    setStatus(newStatus)
    opts.onStatusChange(newStatus)

    // Show user notifications for status changes
    if (status.isOnline !== isOnline) {
      if (isOnline) {
        addToast({
          type: 'success',
          message: 'Connection restored',
          duration: 3000
        })
      } else {
        addToast({
          type: 'warning',
          message: 'You are offline. Some features may not work.',
          duration: 5000
        })
      }
    } else if (isOnline && status.connectionQuality !== newStatus.connectionQuality) {
      if (newStatus.connectionQuality === 'poor') {
        addToast({
          type: 'warning',
          message: 'Poor connection detected. Some features may be slow.',
          duration: 4000
        })
      } else if (newStatus.connectionQuality === 'good' && status.connectionQuality === 'poor') {
        addToast({
          type: 'info',
          message: 'Connection quality improved',
          duration: 2000
        })
      }
    }
  }, [status, measureConnectionQuality, pingServer, addToast, opts])

  // Retry connection
  const retryConnection = useCallback(async () => {
    if (status.retryCount >= opts.maxRetries) {
      addToast({
        type: 'error',
        message: 'Maximum retry attempts reached. Please check your connection.',
        duration: 7000
      })
      return false
    }

    addToast({
      type: 'info',
      message: 'Attempting to reconnect...',
      duration: 2000
    })

    const isConnected = await pingServer()
    if (isConnected) {
      await updateStatus(true)
      return true
    } else {
      setStatus(prev => ({ ...prev, retryCount: prev.retryCount + 1 }))
      return false
    }
  }, [status.retryCount, opts.maxRetries, pingServer, updateStatus, addToast])

  // Setup event listeners and periodic checks
  useEffect(() => {
    const handleOnline = () => updateStatus(true)
    const handleOffline = () => updateStatus(false)

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic connectivity check
    const intervalId = setInterval(async () => {
      if (navigator.onLine) {
        const quality = await measureConnectionQuality()
        setStatus(prev => ({
          ...prev,
          connectionQuality: quality,
          isConnected: quality !== 'poor' || prev.isConnected
        }))
      }
    }, opts.pingInterval)

    // Initial status check - only run once
    updateStatus(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [opts.pingInterval]) // Remove updateStatus and measureConnectionQuality from dependencies to prevent infinite loops

  return {
    ...status,
    retryConnection,
    refresh: () => updateStatus(navigator.onLine)
  }
}

// Utility functions for graceful degradation
export const networkUtils = {
  // Check if feature should be disabled based on connection
  shouldDisableFeature: (status: NetworkStatus, featureType: 'realtime' | 'upload' | 'heavy') => {
    if (!status.isOnline || !status.isConnected) return true
    
    switch (featureType) {
      case 'realtime':
        return status.connectionQuality === 'poor'
      case 'upload':
        return status.connectionQuality === 'offline'
      case 'heavy':
        return status.connectionQuality !== 'good'
      default:
        return false
    }
  },

  // Get user-friendly status message
  getStatusMessage: (status: NetworkStatus): string => {
    if (!status.isOnline) return 'You are offline'
    if (!status.isConnected) return 'No server connection'
    
    switch (status.connectionQuality) {
      case 'good':
        return 'Connected'
      case 'poor':
        return 'Poor connection'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown status'
    }
  },

  // Get appropriate icon for status
  getStatusIcon: (status: NetworkStatus): string => {
    if (!status.isOnline) return '🔴'
    if (!status.isConnected) return '🔴'
    
    switch (status.connectionQuality) {
      case 'good':
        return '🟢'
      case 'poor':
        return '🟡'
      case 'offline':
        return '🔴'
      default:
        return '⚪'
    }
  }
}

export default useNetworkStatus