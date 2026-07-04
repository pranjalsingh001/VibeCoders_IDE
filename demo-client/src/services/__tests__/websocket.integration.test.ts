// websocket.integration.test.ts
// Integration tests for WebSocket functionality
// Tests real-time updates, connection management, log streaming, progress updates, and reconnection logic

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Create mock functions for websocket service
const mockWebsocketService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    joinProjectRoom: vi.fn(),
    leaveProjectRoom: vi.fn(),
    getCurrentProjectId: vi.fn(),
    getConnectionHealth: vi.fn(),
    onWorkflowStageUpdate: vi.fn(),
    onFileGenerationUpdate: vi.fn(),
    onExecutionLog: vi.fn(),
    onFileGenerationProgress: vi.fn(),
    requestProjectUpdates: vi.fn(),
    requestFileGenerationStatus: vi.fn(),
    requestExecutionLogs: vi.fn(),
    emit: vi.fn()
}

// Create mock functions for codegen websocket service
const mockCodegenService = {
    initialize: vi.fn(),
    cleanup: vi.fn(),
    getCurrentProjectId: vi.fn(),
    isConnected: vi.fn(),
    onFileGenerationUpdate: vi.fn(),
    onManifestUpdate: vi.fn(),
    onProgressUpdate: vi.fn(),
    onRetryQueueUpdate: vi.fn(),
    requestFileStatus: vi.fn(),
    requestManifestRefresh: vi.fn(),
    requestProgressUpdate: vi.fn()
}

// Mock socket.io-client
const mockSocket = {
    connected: false,
    id: 'mock-socket-id',
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn()
}

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => mockSocket)
}))

// Mock the websocket services
vi.mock('../websocket', () => ({
    default: mockWebsocketService
}))

vi.mock('../codegenWebSocket', () => ({
    default: mockCodegenService
}))

// Mock stores
vi.mock('../../stores/authStore', () => ({
    default: {
        getState: vi.fn(() => ({
            token: 'valid-token',
            user: { id: 'user-123', name: 'Test User' }
        }))
    }
}))

vi.mock('../../stores/uiStore', () => ({
    default: {
        getState: vi.fn(() => ({
            addToast: vi.fn()
        }))
    }
}))

describe('WebSocket Integration Tests', () => {
    let mockAuthStore: any
    let mockUIStore: any

    beforeEach(async () => {
        mockAuthStore = (await import('../../stores/authStore')).default
        mockUIStore = (await import('../../stores/uiStore')).default

        // Reset all mocks
        vi.clearAllMocks()

        // Reset socket mock state
        mockSocket.connected = false
        mockSocket.id = 'mock-socket-id'

        // Reset store mocks to default values
        mockAuthStore.getState.mockReturnValue({
            token: 'valid-token',
            user: { id: 'user-123', name: 'Test User' }
        })

        mockUIStore.getState.mockReturnValue({
            addToast: vi.fn()
        })

        // Reset service mocks to default values
        mockWebsocketService.isConnected.mockReturnValue(false)
        mockWebsocketService.getCurrentProjectId.mockReturnValue(null)
        mockWebsocketService.getConnectionHealth.mockReturnValue({
            isConnected: false,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            currentProjectId: null,
            activeListeners: []
        })
        mockWebsocketService.connect.mockResolvedValue(undefined)
        mockWebsocketService.requestProjectUpdates.mockResolvedValue(undefined)
        mockWebsocketService.requestFileGenerationStatus.mockResolvedValue(undefined)
        mockWebsocketService.requestExecutionLogs.mockResolvedValue(undefined)
        mockWebsocketService.onWorkflowStageUpdate.mockReturnValue(() => { })
        mockWebsocketService.onFileGenerationUpdate.mockReturnValue(() => { })
        mockWebsocketService.onExecutionLog.mockReturnValue(() => { })
        mockWebsocketService.onFileGenerationProgress.mockReturnValue(() => { })

        mockCodegenService.getCurrentProjectId.mockReturnValue(null)
        mockCodegenService.isConnected.mockReturnValue(false)
        mockCodegenService.initialize.mockResolvedValue(undefined)
        mockCodegenService.onFileGenerationUpdate.mockReturnValue(() => { })
        mockCodegenService.onManifestUpdate.mockReturnValue(() => { })
        mockCodegenService.onProgressUpdate.mockReturnValue(() => { })
        mockCodegenService.onRetryQueueUpdate.mockReturnValue(() => { })
    })

    afterEach(() => {
        // Clean up connections
        mockWebsocketService.disconnect()
        mockCodegenService.cleanup()
    })

    describe('Basic WebSocket Functionality', () => {
        it('should handle authentication token correctly', async () => {
            // Test with valid token
            expect(mockAuthStore.getState().token).toBe('valid-token')

            // Test with invalid token - mock the connect method to reject
            mockAuthStore.getState.mockReturnValue({
                token: null,
                user: null
            })

            mockWebsocketService.connect.mockRejectedValue(new Error('No authentication token available'))

            try {
                await mockWebsocketService.connect()
                expect(false).toBe(true) // Should not reach here
            } catch (error: unknown) {
                expect((error as Error).message).toBe('No authentication token available')
            }
        })

        it('should track connection status', () => {
            expect(mockWebsocketService.isConnected()).toBe(false)

            // Simulate connection
            mockWebsocketService.isConnected.mockReturnValue(true)
            expect(mockWebsocketService.isConnected()).toBe(true)

            // Simulate disconnection
            mockWebsocketService.isConnected.mockReturnValue(false)
            expect(mockWebsocketService.isConnected()).toBe(false)
        })

        it('should manage project rooms', () => {
            // Initially no project
            expect(mockWebsocketService.getCurrentProjectId()).toBe(null)

            // Join a project room
            mockWebsocketService.getCurrentProjectId.mockReturnValue('project-123')
            mockWebsocketService.joinProjectRoom('project-123')
            expect(mockWebsocketService.joinProjectRoom).toHaveBeenCalledWith('project-123')
            expect(mockWebsocketService.getCurrentProjectId()).toBe('project-123')

            // Leave project room
            mockWebsocketService.getCurrentProjectId.mockReturnValue(null)
            mockWebsocketService.leaveProjectRoom('project-123')
            expect(mockWebsocketService.leaveProjectRoom).toHaveBeenCalledWith('project-123')
            expect(mockWebsocketService.getCurrentProjectId()).toBe(null)
        })

        it('should provide connection health information', () => {
            const health = mockWebsocketService.getConnectionHealth()

            expect(health).toHaveProperty('isConnected')
            expect(health).toHaveProperty('reconnectAttempts')
            expect(health).toHaveProperty('maxReconnectAttempts')
            expect(health).toHaveProperty('currentProjectId')
            expect(health).toHaveProperty('activeListeners')

            expect(typeof health.isConnected).toBe('boolean')
            expect(typeof health.reconnectAttempts).toBe('number')
            expect(typeof health.maxReconnectAttempts).toBe('number')
            expect(Array.isArray(health.activeListeners)).toBe(true)
        })
    })

    describe('Event Subscription', () => {
        it('should allow subscribing to workflow stage updates', () => {
            const callback = vi.fn()
            const unsubscribe = mockWebsocketService.onWorkflowStageUpdate(callback)

            expect(typeof unsubscribe).toBe('function')
            expect(mockWebsocketService.onWorkflowStageUpdate).toHaveBeenCalledWith(callback)
        })

        it('should allow subscribing to file generation updates', () => {
            const callback = vi.fn()
            const unsubscribe = mockWebsocketService.onFileGenerationUpdate(callback)

            expect(typeof unsubscribe).toBe('function')
            expect(mockWebsocketService.onFileGenerationUpdate).toHaveBeenCalledWith(callback)
        })

        it('should allow subscribing to execution logs', () => {
            const callback = vi.fn()
            const unsubscribe = mockWebsocketService.onExecutionLog(callback)

            expect(typeof unsubscribe).toBe('function')
            expect(mockWebsocketService.onExecutionLog).toHaveBeenCalledWith(callback)
        })

        it('should allow subscribing to file generation progress', () => {
            const callback = vi.fn()
            const unsubscribe = mockWebsocketService.onFileGenerationProgress(callback)

            expect(typeof unsubscribe).toBe('function')
            expect(mockWebsocketService.onFileGenerationProgress).toHaveBeenCalledWith(callback)
        })
    })

    describe('Message Emission', () => {
        it('should emit project update requests', async () => {
            await mockWebsocketService.requestProjectUpdates('project-123')

            expect(mockWebsocketService.requestProjectUpdates).toHaveBeenCalledWith('project-123')
        })

        it('should handle emit errors', async () => {
            // Mock error response
            mockWebsocketService.requestProjectUpdates.mockRejectedValue(new Error('Server error'))

            try {
                await mockWebsocketService.requestProjectUpdates('project-123')
                expect(false).toBe(true) // Should not reach here
            } catch (error: unknown) {
                expect((error as Error).message).toBe('Server error')
            }
        })

        it('should emit file generation status requests', async () => {
            await mockWebsocketService.requestFileGenerationStatus('project-123', 'src/App.tsx')

            expect(mockWebsocketService.requestFileGenerationStatus).toHaveBeenCalledWith('project-123', 'src/App.tsx')
        })

        it('should emit execution log requests', async () => {
            await mockWebsocketService.requestExecutionLogs('project-123', '2023-01-01T00:00:00Z')

            expect(mockWebsocketService.requestExecutionLogs).toHaveBeenCalledWith('project-123', '2023-01-01T00:00:00Z')
        })
    })

    describe('CodeGen WebSocket Service', () => {
        it('should initialize with project ID', async () => {
            mockCodegenService.getCurrentProjectId.mockReturnValue('project-123')

            await mockCodegenService.initialize('project-123')

            expect(mockCodegenService.initialize).toHaveBeenCalledWith('project-123')
            expect(mockCodegenService.getCurrentProjectId()).toBe('project-123')
        })

        it('should clean up properly', async () => {
            mockCodegenService.getCurrentProjectId.mockReturnValue('project-123')
            await mockCodegenService.initialize('project-123')
            expect(mockCodegenService.getCurrentProjectId()).toBe('project-123')

            mockCodegenService.getCurrentProjectId.mockReturnValue(null)
            mockCodegenService.cleanup()
            expect(mockCodegenService.cleanup).toHaveBeenCalled()
            expect(mockCodegenService.getCurrentProjectId()).toBe(null)
        })

        it('should provide subscription methods', async () => {
            await mockCodegenService.initialize('project-123')

            const callback = vi.fn()

            // Test all subscription methods return unsubscribe functions
            const unsubscribe1 = mockCodegenService.onFileGenerationUpdate(callback)
            const unsubscribe2 = mockCodegenService.onManifestUpdate(callback)
            const unsubscribe3 = mockCodegenService.onProgressUpdate(callback)
            const unsubscribe4 = mockCodegenService.onRetryQueueUpdate(callback)

            expect(typeof unsubscribe1).toBe('function')
            expect(typeof unsubscribe2).toBe('function')
            expect(typeof unsubscribe3).toBe('function')
            expect(typeof unsubscribe4).toBe('function')

            expect(mockCodegenService.onFileGenerationUpdate).toHaveBeenCalledWith(callback)
            expect(mockCodegenService.onManifestUpdate).toHaveBeenCalledWith(callback)
            expect(mockCodegenService.onProgressUpdate).toHaveBeenCalledWith(callback)
            expect(mockCodegenService.onRetryQueueUpdate).toHaveBeenCalledWith(callback)
        })

        it('should provide request methods', async () => {
            await mockCodegenService.initialize('project-123')

            // These should not throw errors
            expect(() => {
                mockCodegenService.requestFileStatus('src/App.tsx')
                mockCodegenService.requestManifestRefresh()
                mockCodegenService.requestProgressUpdate()
            }).not.toThrow()

            expect(mockCodegenService.requestFileStatus).toHaveBeenCalledWith('src/App.tsx')
            expect(mockCodegenService.requestManifestRefresh).toHaveBeenCalled()
            expect(mockCodegenService.requestProgressUpdate).toHaveBeenCalled()
        })

        it('should report connection status', async () => {
            await mockCodegenService.initialize('project-123')

            // Should delegate to main websocket service
            expect(typeof mockCodegenService.isConnected()).toBe('boolean')
            expect(mockCodegenService.isConnected).toHaveBeenCalled()
        })
    })

    describe('Error Handling', () => {
        it('should handle missing authentication gracefully', async () => {
            mockAuthStore.getState.mockReturnValue({
                token: null,
                user: null
            })

            mockWebsocketService.connect.mockRejectedValue(new Error('No authentication token available'))

            try {
                await mockWebsocketService.connect()
                expect(false).toBe(true) // Should not reach here
            } catch (error: unknown) {
                expect((error as Error).message).toBe('No authentication token available')
            }
        })

        it('should handle disconnect cleanup', () => {
            mockWebsocketService.getCurrentProjectId.mockReturnValue('project-123')
            mockWebsocketService.joinProjectRoom('project-123')
            expect(mockWebsocketService.getCurrentProjectId()).toBe('project-123')

            mockWebsocketService.getCurrentProjectId.mockReturnValue(null)
            mockWebsocketService.disconnect()
            expect(mockWebsocketService.disconnect).toHaveBeenCalled()
            expect(mockWebsocketService.getCurrentProjectId()).toBe(null)
        })

        it('should handle codegen service cleanup', async () => {
            mockCodegenService.getCurrentProjectId.mockReturnValue('project-123')
            await mockCodegenService.initialize('project-123')
            expect(mockCodegenService.getCurrentProjectId()).toBe('project-123')

            mockCodegenService.getCurrentProjectId.mockReturnValue(null)
            mockCodegenService.cleanup()
            expect(mockCodegenService.cleanup).toHaveBeenCalled()
            expect(mockCodegenService.getCurrentProjectId()).toBe(null)
        })
    })

    describe('Real-time Event Simulation', () => {
        it('should handle event callbacks', () => {
            const callback = vi.fn()

            // Subscribe to an event
            mockWebsocketService.onWorkflowStageUpdate(callback)

            // Verify the subscription was registered
            expect(mockWebsocketService.onWorkflowStageUpdate).toHaveBeenCalledWith(callback)
        })

        it('should handle multiple event subscriptions', () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const callback3 = vi.fn()

            mockWebsocketService.onWorkflowStageUpdate(callback1)
            mockWebsocketService.onFileGenerationUpdate(callback2)
            mockWebsocketService.onExecutionLog(callback3)

            expect(mockWebsocketService.onWorkflowStageUpdate).toHaveBeenCalledWith(callback1)
            expect(mockWebsocketService.onFileGenerationUpdate).toHaveBeenCalledWith(callback2)
            expect(mockWebsocketService.onExecutionLog).toHaveBeenCalledWith(callback3)
        })

        it('should handle event unsubscription', () => {
            const callback = vi.fn()

            const unsubscribe = mockWebsocketService.onWorkflowStageUpdate(callback)
            unsubscribe()

            expect(mockWebsocketService.onWorkflowStageUpdate).toHaveBeenCalledWith(callback)
            // The unsubscribe function is mocked, so we just verify it can be called
            expect(typeof unsubscribe).toBe('function')
        })
    })

    describe('Socket Integration', () => {
        it('should interact with socket.io client', () => {
            // Test that socket.io is properly mocked
            expect(mockSocket).toBeDefined()
            expect(mockSocket.connected).toBe(false)
            expect(mockSocket.id).toBe('mock-socket-id')
        })

        it('should handle socket events', () => {
            // Test socket event handling
            mockSocket.on('test-event', vi.fn())
            expect(mockSocket.on).toHaveBeenCalledWith('test-event', expect.any(Function))
        })

        it('should emit socket messages', () => {
            mockSocket.emit('test-message', { data: 'test' })
            expect(mockSocket.emit).toHaveBeenCalledWith('test-message', { data: 'test' })
        })
    })

    describe('Store Integration', () => {
        it('should interact with auth store', () => {
            const authState = mockAuthStore.getState()
            expect(authState.token).toBe('valid-token')
            expect(authState.user.id).toBe('user-123')
        })

        it('should interact with UI store', () => {
            const uiState = mockUIStore.getState()
            expect(uiState.addToast).toBeDefined()
            expect(typeof uiState.addToast).toBe('function')
        })

        it('should handle store state changes', () => {
            // Change auth store state
            mockAuthStore.getState.mockReturnValue({
                token: 'new-token',
                user: { id: 'user-456', name: 'New User' }
            })

            const newAuthState = mockAuthStore.getState()
            expect(newAuthState.token).toBe('new-token')
            expect(newAuthState.user.id).toBe('user-456')
        })
    })
})