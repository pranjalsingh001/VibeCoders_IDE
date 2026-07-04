// uiStore.test.ts
// Unit tests for UI store

import { describe, it, expect, beforeEach, vi } from 'vitest'
import useUIStore from '../uiStore'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: 'light',
      sidebarCollapsed: false,
      modals: {
        newProject: false,
        confirmDelete: false,
        viewRawJson: false,
        planningHelp: false,
        codegenProgress: false,
      },
      toasts: [],
      globalLoading: false,
      loadingMessage: null,
    })
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState()
      
      expect(state.theme).toBe('light')
      expect(state.sidebarCollapsed).toBe(false)
      expect(state.toasts).toEqual([])
      expect(state.globalLoading).toBe(false)
      expect(state.loadingMessage).toBeNull()
      
      // Check all modals are closed
      Object.values(state.modals).forEach(modalState => {
        expect(modalState).toBe(false)
      })
    })

    it('should initialize with default theme when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { theme } = useUIStore.getState()
      expect(theme).toBe('light')
    })

    it('should initialize with default sidebar state when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { sidebarCollapsed } = useUIStore.getState()
      expect(sidebarCollapsed).toBe(false)
    })
  })

  describe('Theme Actions', () => {
    it('should set theme to dark', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('dark')

      const state = useUIStore.getState()
      expect(state.theme).toBe('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('should set theme to light', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('light')

      const state = useUIStore.getState()
      expect(state.theme).toBe('light')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
    })
  })

  describe('Sidebar Actions', () => {
    it('should toggle sidebar from collapsed to expanded', () => {
      useUIStore.setState({ sidebarCollapsed: true })
      
      const { toggleSidebar } = useUIStore.getState()
      toggleSidebar()

      const state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'false')
    })

    it('should toggle sidebar from expanded to collapsed', () => {
      useUIStore.setState({ sidebarCollapsed: false })
      
      const { toggleSidebar } = useUIStore.getState()
      toggleSidebar()

      const state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true')
    })

    it('should set sidebar collapsed state directly', () => {
      const { setSidebarCollapsed } = useUIStore.getState()
      setSidebarCollapsed(true)

      const state = useUIStore.getState()
      expect(state.sidebarCollapsed).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true')
    })
  })

  describe('Modal Actions', () => {
    it('should open a modal', () => {
      const { openModal } = useUIStore.getState()
      openModal('newProject')

      const state = useUIStore.getState()
      expect(state.modals.newProject).toBe(true)
    })

    it('should close a modal', () => {
      useUIStore.setState({
        modals: {
          newProject: true,
          confirmDelete: false,
          viewRawJson: false,
          planningHelp: false,
          codegenProgress: false,
        }
      })

      const { closeModal } = useUIStore.getState()
      closeModal('newProject')

      const state = useUIStore.getState()
      expect(state.modals.newProject).toBe(false)
    })

    it('should close all modals', () => {
      useUIStore.setState({
        modals: {
          newProject: true,
          confirmDelete: true,
          viewRawJson: true,
          planningHelp: true,
          codegenProgress: true,
        }
      })

      const { closeAllModals } = useUIStore.getState()
      closeAllModals()

      const state = useUIStore.getState()
      Object.values(state.modals).forEach(modalState => {
        expect(modalState).toBe(false)
      })
    })
  })

  describe('Toast Actions', () => {
    it('should add a toast with default duration', () => {
      const { addToast } = useUIStore.getState()
      const toast = {
        type: 'success' as const,
        message: 'Test message'
      }
      
      addToast(toast)

      const state = useUIStore.getState()
      expect(state.toasts).toHaveLength(1)
      expect(state.toasts[0]).toMatchObject({
        ...toast,
        duration: 5000,
        id: expect.any(String)
      })
    })

    it('should add a toast with custom duration', () => {
      const { addToast } = useUIStore.getState()
      const toast = {
        type: 'error' as const,
        message: 'Error message',
        duration: 10000
      }
      
      addToast(toast)

      const state = useUIStore.getState()
      expect(state.toasts[0].duration).toBe(10000)
    })

    it('should add a toast with actions', () => {
      const { addToast } = useUIStore.getState()
      const mockAction = { label: 'Retry', onClick: vi.fn() }
      const toast = {
        type: 'warning' as const,
        message: 'Warning message',
        actions: [mockAction]
      }
      
      addToast(toast)

      const state = useUIStore.getState()
      expect(state.toasts[0].actions).toEqual([mockAction])
    })

    it('should remove a toast by id', () => {
      const { addToast, removeToast } = useUIStore.getState()
      
      addToast({ type: 'info', message: 'Test 1' })
      addToast({ type: 'info', message: 'Test 2' })
      
      const state = useUIStore.getState()
      const toastId = state.toasts[0].id
      
      removeToast(toastId)
      
      const newState = useUIStore.getState()
      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].message).toBe('Test 2')
    })

    it('should clear all toasts', () => {
      const { addToast, clearToasts } = useUIStore.getState()
      
      addToast({ type: 'info', message: 'Test 1' })
      addToast({ type: 'info', message: 'Test 2' })
      
      clearToasts()
      
      const state = useUIStore.getState()
      expect(state.toasts).toHaveLength(0)
    })

    it('should create toast with auto-remove functionality', () => {
      const { addToast } = useUIStore.getState()
      addToast({ 
        type: 'info', 
        message: 'Auto remove test',
        duration: 1000
      })

      const state = useUIStore.getState()
      expect(state.toasts).toHaveLength(1)
      expect(state.toasts[0].duration).toBe(1000)
    })

    it('should create persistent toast with duration 0', () => {
      const { addToast } = useUIStore.getState()
      addToast({ 
        type: 'error', 
        message: 'Persistent toast',
        duration: 0
      })

      const state = useUIStore.getState()
      expect(state.toasts).toHaveLength(1)
      expect(state.toasts[0].duration).toBe(0)
    })
  })

  describe('Loading Actions', () => {
    it('should set global loading state', () => {
      const { setGlobalLoading } = useUIStore.getState()
      setGlobalLoading(true, 'Loading data...')

      const state = useUIStore.getState()
      expect(state.globalLoading).toBe(true)
      expect(state.loadingMessage).toBe('Loading data...')
    })

    it('should clear global loading state', () => {
      useUIStore.setState({ globalLoading: true, loadingMessage: 'Loading...' })
      
      const { setGlobalLoading } = useUIStore.getState()
      setGlobalLoading(false)

      const state = useUIStore.getState()
      expect(state.globalLoading).toBe(false)
      expect(state.loadingMessage).toBeNull()
    })

    it('should set loading without message', () => {
      const { setGlobalLoading } = useUIStore.getState()
      setGlobalLoading(true)

      const state = useUIStore.getState()
      expect(state.globalLoading).toBe(true)
      expect(state.loadingMessage).toBeNull()
    })
  })
})