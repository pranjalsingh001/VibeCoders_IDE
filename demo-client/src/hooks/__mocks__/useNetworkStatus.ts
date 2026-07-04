// __mocks__/useNetworkStatus.ts
// Mock implementation of useNetworkStatus hook for testing

import { vi } from 'vitest'

const mockUseNetworkStatus = vi.fn(() => ({
  isOnline: true,
  isConnected: true,
  connectionQuality: 'good' as const,
  lastConnected: new Date(),
  retryCount: 0,
  retryConnection: vi.fn(() => Promise.resolve(true)),
  refresh: vi.fn()
}))

export const networkUtils = {
  shouldDisableFeature: vi.fn(() => false),
  getStatusMessage: vi.fn(() => 'Connected'),
  getStatusIcon: vi.fn(() => '🟢')
}

export const useNetworkStatus = mockUseNetworkStatus
export default mockUseNetworkStatus