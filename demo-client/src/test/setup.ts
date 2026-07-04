// test/setup.ts
// Test setup file for Vitest

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
})

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:5173',
        origin: 'http://localhost:5173',
        pathname: '/',
        search: '',
        hash: '',
        reload: vi.fn(),
    },
    writable: true,
})

// Mock document.documentElement.classList
Object.defineProperty(document.documentElement, 'classList', {
    value: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn(),
    },
    writable: true,
})

// Mock environment variables
vi.mock('import.meta', () => ({
    env: {
        VITE_API_BASE_URL: 'http://localhost:5000/api/v1'
    }
}))

// Mock fetch globally
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers(),
    } as Response)
)

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
})

// Mock performance.now
Object.defineProperty(window, 'performance', {
    value: {
        now: vi.fn(() => Date.now()),
    },
    writable: true,
})

// Mock AbortController
global.AbortController = class AbortController {
    signal = {
        aborted: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }
    abort = vi.fn()
}

// Mock setTimeout and clearTimeout to prevent infinite loops in tests
const originalSetTimeout = global.setTimeout
const originalClearTimeout = global.clearTimeout
const originalSetInterval = global.setInterval
const originalClearInterval = global.clearInterval

// Track active timers to clean them up
const activeTimers = new Set()

global.setTimeout = vi.fn((callback, delay) => {
    const id = originalSetTimeout(callback, Math.min(delay || 0, 100)) // Cap delays at 100ms for tests
    activeTimers.add(id)
    return id
})

global.clearTimeout = vi.fn((id) => {
    activeTimers.delete(id)
    return originalClearTimeout(id)
})

global.setInterval = vi.fn((callback, delay) => {
    const id = originalSetInterval(callback, Math.min(delay || 0, 100)) // Cap intervals at 100ms for tests
    activeTimers.add(id)
    return id
})

global.clearInterval = vi.fn((id) => {
    activeTimers.delete(id)
    return originalClearInterval(id)
})

// Clean up timers after each test
afterEach(() => {
    activeTimers.forEach(id => {
        originalClearTimeout(id)
        originalClearInterval(id)
    })
    activeTimers.clear()
    vi.clearAllTimers()
})

// Mock useNetworkStatus hook to prevent infinite requests in tests
// but allow networkUtils to be tested normally
vi.mock('../hooks/useNetworkStatus', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        useNetworkStatus: vi.fn(() => ({
            isOnline: true,
            isConnected: true,
            connectionQuality: 'good',
            lastConnected: new Date(),
            retryCount: 0,
            retryConnection: vi.fn(() => Promise.resolve(true)),
            refresh: vi.fn()
        })),
        default: vi.fn(() => ({
            isOnline: true,
            isConnected: true,
            connectionQuality: 'good',
            lastConnected: new Date(),
            retryCount: 0,
            retryConnection: vi.fn(() => Promise.resolve(true)),
            refresh: vi.fn()
        }))
    }
})

vi.mock('../hooks/useWebSocket', () => ({
    useRealTimeUpdates: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connected: false,
        isConnected: false,
        connectionHealth: {
            isConnected: false,
            currentProjectId: null,
            activeListeners: 0
        }
    })),
    useWebSocket: vi.fn(() => ({
        socket: null,
        isConnected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        joinProject: vi.fn(),
        leaveProject: vi.fn(),
        requestProjectUpdates: vi.fn(),
        requestFileGenerationStatus: vi.fn(),
        requestExecutionLogs: vi.fn(),
        connectionHealth: {
            isConnected: false,
            currentProjectId: null,
            activeListeners: 0
        }
    })),
    useExecutionLogs: vi.fn(() => ({
        logs: [],
        isConnected: false,
        connect: vi.fn(),
        disconnect: vi.fn()
    }))
}))

// Mock WebSocket services
vi.mock('../services/websocket', () => ({
    default: {
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        isConnected: false
    }
}))

vi.mock('../services/codegenWebSocket', () => ({
    default: {
        initialize: vi.fn(() => Promise.resolve()),
        cleanup: vi.fn(),
        onFileGenerationUpdate: vi.fn(() => vi.fn()),
        onManifestUpdate: vi.fn(() => vi.fn()),
        onProgressUpdate: vi.fn(() => vi.fn()),
        onRetryQueueUpdate: vi.fn(() => vi.fn())
    }
}))

// Mock codegenService API
vi.mock('../services/codegenService', () => ({
    codegenAPI: {
        getManifest: vi.fn(() => Promise.resolve({
            success: true,
            manifest: null
        })),
        getProgress: vi.fn(() => Promise.resolve({
            success: true,
            progress: {
                totalFiles: 0,
                completedFiles: 0,
                failedFiles: 0,
                pendingFiles: 0,
                inProgressFiles: 0,
                percentage: 0
            }
        })),
        createManifest: vi.fn(() => Promise.resolve({
            success: true,
            manifest: {
                id: 'test-manifest',
                files: [],
                totalFiles: 0,
                completedFiles: 0,
                failedFiles: 0,
                pendingFiles: 0,
                inProgressFiles: 0
            },
            validationResult: {
                isValid: true,
                errors: [],
                warnings: [],
                missingFiles: [],
                extraFiles: [],
                score: 100
            }
        })),
        startGeneration: vi.fn(() => Promise.resolve({
            success: true,
            jobId: 'test-job',
            manifest: {}
        })),
        retryFile: vi.fn(() => Promise.resolve({
            success: true,
            filePath: 'test-file'
        })),
        retryFailedFiles: vi.fn(() => Promise.resolve({
            success: true,
            retriedFiles: [],
            failedRetries: [],
            message: 'Success'
        })),
        stopGeneration: vi.fn(() => Promise.resolve({
            success: true
        }))
    }
}))

// Mock other API services
vi.mock('../services/planningService', () => ({
    savePlanningAnswers: vi.fn(() => Promise.resolve({
        success: true,
        data: { id: 'test-planning' }
    })),
    getPlanningAnswers: vi.fn(() => Promise.resolve({
        success: true,
        data: null
    }))
}))

vi.mock('../services/blueprintService', () => ({
    generateBlueprint: vi.fn(() => Promise.resolve({
        success: true,
        data: { id: 'test-blueprint' }
    }))
}))

vi.mock('../services/designService', () => ({
    generateHLD: vi.fn(() => Promise.resolve({
        success: true,
        data: { id: 'test-hld' }
    })),
    generateLLD: vi.fn(() => Promise.resolve({
        success: true,
        data: { id: 'test-lld' }
    }))
}))

vi.mock('../services/projectService', () => ({
    projectAPI: {
        list: vi.fn(() => Promise.resolve([])),
        create: vi.fn(() => Promise.resolve({ id: 'test-project' })),
        get: vi.fn(() => Promise.resolve({ id: 'test-project' })),
        delete: vi.fn(() => Promise.resolve())
    }
}))

// Mock Mermaid to prevent diagram rendering issues
vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn(() => Promise.resolve({ svg: '<svg></svg>' })),
        parse: vi.fn(() => true),
        mermaidAPI: {
            initialize: vi.fn(),
            render: vi.fn(() => '<svg></svg>')
        }
    }
}))

// Mock HTMLCanvasElement to prevent canvas-related errors
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
}))

// Mock WebSocketStatus component to prevent connectionHealth errors
vi.mock('../components/ui/WebSocketStatus', () => ({
    WebSocketStatusIndicator: () => null,
    default: () => null
}))

// Mock Zustand stores
const mockUIStoreState = {
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
    toasts: []
}

const mockUIStore = Object.assign(
    vi.fn(() => mockUIStoreState),
    {
        getState: vi.fn(() => mockUIStoreState),
        setState: vi.fn(),
        subscribe: vi.fn(),
        destroy: vi.fn()
    }
)

vi.mock('../stores/uiStore', () => ({
    default: mockUIStore
}))

const mockAuthStoreState = {
    user: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn(() => Promise.resolve())
}

const mockAuthStore = Object.assign(
    vi.fn(() => mockAuthStoreState),
    {
        getState: vi.fn(() => mockAuthStoreState),
        setState: vi.fn(),
        subscribe: vi.fn(),
        destroy: vi.fn()
    }
)

vi.mock('../stores/authStore', () => ({
    default: mockAuthStore
}))

vi.mock('../stores/projectStore', () => ({
    default: vi.fn(() => ({
        projects: [],
        currentProject: null,
        loading: false,
        error: null,
        fetchProjects: vi.fn(),
        createProject: vi.fn(),
        updateProject: vi.fn(),
        deleteProject: vi.fn()
    }))
}))

vi.mock('../stores/workflowStore', () => ({
    default: vi.fn(() => ({
        currentStage: 'planning',
        stageStatus: {},
        stageResults: {},
        isLoading: false,
        error: null,
        setCurrentStage: vi.fn(),
        updateStageStatus: vi.fn(),
        updateStageResult: vi.fn()
    }))
}))

vi.mock('../stores/fileStore', () => ({
    default: vi.fn(() => ({
        files: [],
        currentFile: null,
        loading: false,
        error: null,
        fetchFiles: vi.fn(),
        saveFile: vi.fn(),
        deleteFile: vi.fn()
    }))
}))

// Ensure proper test isolation
beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    
    // Reset DOM
    document.body.innerHTML = ''
    
    // Clear any existing timers
    vi.clearAllTimers()
})

afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks()
    vi.clearAllTimers()
    
    // Clear DOM
    document.body.innerHTML = ''
})