// __mocks__/useWebSocket.ts
// Mock implementation of useWebSocket hook for testing

import { vi } from 'vitest'

export const useRealTimeUpdates = vi.fn(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: false
}))

export const useWebSocket = vi.fn(() => ({
  socket: null,
  isConnected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}))

export default useWebSocket