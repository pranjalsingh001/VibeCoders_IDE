// useNetworkStatus.test.ts
// -------------------------
// Tests for the useNetworkStatus hook

import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import useNetworkStatus, { networkUtils } from '../useNetworkStatus'

// Mock fetch
global.fetch = vi.fn()

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock useUIStore
vi.mock('../../stores/uiStore', () => ({
  default: () => ({
    addToast: vi.fn()
  })
}))

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    navigator.onLine = true
    
    // Mock successful fetch by default
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('initializes with online status', async () => {
    const { result } = renderHook(() => useNetworkStatus({ 
      pingInterval: 100,
      pingTimeout: 200 
    }))

    expect(result.current.isOnline).toBe(true)
    // Wait for initial connection check
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    }, { timeout: 1000 })
  })

  it('initializes with offline status when navigator is offline', async () => {
    navigator.onLine = false

    const { result } = renderHook(() => useNetworkStatus({ 
      pingInterval: 100,
      pingTimeout: 200 
    }))

    expect(result.current.isOnline).toBe(false)
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionQuality).toBe('offline')
    }, { timeout: 1000 })
  })

  it('detects poor connection quality with slow response', async () => {
    // Mock slow response
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ ok: true, status: 200 }), 1200)
      )
    )

    const { result } = renderHook(() => useNetworkStatus({ 
      pingInterval: 100, // Reduce interval for faster tests
      pingTimeout: 500 
    }))

    await waitFor(() => {
      expect(result.current.connectionQuality).toBe('poor')
    }, { timeout: 2000 })
  })

  it('handles server ping failure', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useNetworkStatus({ 
      pingInterval: 100,
      pingTimeout: 200 
    }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false)
    }, { timeout: 1000 })
  })

  it('responds to online/offline events', async () => {
    const { result } = renderHook(() => useNetworkStatus({ 
      pingInterval: 100,
      pingTimeout: 200 
    }))

    // Simulate going offline
    act(() => {
      navigator.onLine = false
      window.dispatchEvent(new Event('offline'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
      expect(result.current.connectionQuality).toBe('offline')
    }, { timeout: 1000 })

    // Simulate coming back online
    act(() => {
      navigator.onLine = true
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    }, { timeout: 1000 })
  })

  it('provides retry functionality', async () => {
    // Start with failed connection
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
    
    const { result } = renderHook(() => useNetworkStatus({ 
      pingInterval: 100,
      pingTimeout: 200 
    }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false)
    }, { timeout: 1000 })

    // Mock successful retry
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200 })

    await act(async () => {
      const success = await result.current.retryConnection()
      expect(success).toBe(true)
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('limits retry attempts', async () => {
    const { result } = renderHook(() => useNetworkStatus({ maxRetries: 2 }))

    // Simulate multiple failed retries
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

    // First retry
    await act(async () => {
      await result.current.retryConnection()
    })
    expect(result.current.retryCount).toBe(1)

    // Second retry
    await act(async () => {
      await result.current.retryConnection()
    })
    expect(result.current.retryCount).toBe(2)

    // Third retry should fail due to max retries
    await act(async () => {
      const success = await result.current.retryConnection()
      expect(success).toBe(false)
    })
  })

  it('calls onStatusChange callback', async () => {
    const onStatusChange = vi.fn()
    
    renderHook(() => useNetworkStatus({ 
      onStatusChange,
      pingInterval: 100,
      pingTimeout: 200 
    }))

    // Wait for initial status check
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('handles fetch timeout', async () => {
    // Mock fetch that times out
    ;(global.fetch as any).mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 150)
      )
    )

    const { result } = renderHook(() => useNetworkStatus({ 
      pingTimeout: 100,
      pingInterval: 100 
    }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false)
    }, { timeout: 1000 })
  })
})

describe('networkUtils', () => {
  it('correctly identifies features to disable based on connection', () => {
    const goodStatus = {
      isOnline: true,
      isConnected: true,
      connectionQuality: 'good' as const,
      lastConnected: new Date(),
      retryCount: 0
    }

    const poorStatus = {
      ...goodStatus,
      connectionQuality: 'poor' as const
    }

    const offlineStatus = {
      ...goodStatus,
      isOnline: false,
      isConnected: false,
      connectionQuality: 'offline' as const
    }

    // Good connection - no features disabled
    expect(networkUtils.shouldDisableFeature(goodStatus, 'realtime')).toBe(false)
    expect(networkUtils.shouldDisableFeature(goodStatus, 'upload')).toBe(false)
    expect(networkUtils.shouldDisableFeature(goodStatus, 'heavy')).toBe(false)

    // Poor connection - realtime and heavy features disabled
    expect(networkUtils.shouldDisableFeature(poorStatus, 'realtime')).toBe(true)
    expect(networkUtils.shouldDisableFeature(poorStatus, 'upload')).toBe(false)
    expect(networkUtils.shouldDisableFeature(poorStatus, 'heavy')).toBe(true)

    // Offline - all features disabled
    expect(networkUtils.shouldDisableFeature(offlineStatus, 'realtime')).toBe(true)
    expect(networkUtils.shouldDisableFeature(offlineStatus, 'upload')).toBe(true)
    expect(networkUtils.shouldDisableFeature(offlineStatus, 'heavy')).toBe(true)
  })

  it('provides appropriate status messages', () => {
    const onlineGood = {
      isOnline: true,
      isConnected: true,
      connectionQuality: 'good' as const,
      lastConnected: new Date(),
      retryCount: 0
    }

    const onlinePoor = { ...onlineGood, connectionQuality: 'poor' as const }
    const offline = { ...onlineGood, isOnline: false, isConnected: false, connectionQuality: 'offline' as const }

    expect(networkUtils.getStatusMessage(onlineGood)).toBe('Connected')
    expect(networkUtils.getStatusMessage(onlinePoor)).toBe('Poor connection')
    expect(networkUtils.getStatusMessage(offline)).toBe('You are offline')
  })

  it('provides appropriate status icons', () => {
    const onlineGood = {
      isOnline: true,
      isConnected: true,
      connectionQuality: 'good' as const,
      lastConnected: new Date(),
      retryCount: 0
    }

    const onlinePoor = { ...onlineGood, connectionQuality: 'poor' as const }
    const offline = { ...onlineGood, isOnline: false, isConnected: false, connectionQuality: 'offline' as const }

    expect(networkUtils.getStatusIcon(onlineGood)).toBe('🟢')
    expect(networkUtils.getStatusIcon(onlinePoor)).toBe('🟡')
    expect(networkUtils.getStatusIcon(offline)).toBe('🔴')
  })
})