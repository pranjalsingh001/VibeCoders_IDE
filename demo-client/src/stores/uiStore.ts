// uiStore.ts
// ----------
// Manages global UI state: modals, toasts, theme, sidebar, loading states

import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ModalState {
  newProject: boolean
  confirmDelete: boolean
  viewRawJson: boolean
  planningHelp: boolean
  codegenProgress: boolean
}

interface UIState {
  // Theme
  theme: 'light' | 'dark'
  
  // Layout
  sidebarCollapsed: boolean
  
  // Modals
  modals: ModalState
  
  // Toasts
  toasts: Toast[]
  
  // Loading states
  globalLoading: boolean
  loadingMessage: string | null
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Modal actions
  openModal: (modal: keyof ModalState) => void
  closeModal: (modal: keyof ModalState) => void
  closeAllModals: () => void
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void
}

const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  
  modals: {
    newProject: false,
    confirmDelete: false,
    viewRawJson: false,
    planningHelp: false,
    codegenProgress: false
  },
  
  toasts: [],
  globalLoading: false,
  loadingMessage: null,
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('theme', theme)
    set({ theme })
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  
  // Sidebar actions
  toggleSidebar: () => {
    const newCollapsed = !get().sidebarCollapsed
    localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
    set({ sidebarCollapsed: newCollapsed })
  },
  
  setSidebarCollapsed: (collapsed: boolean) => {
    localStorage.setItem('sidebarCollapsed', collapsed.toString())
    set({ sidebarCollapsed: collapsed })
  },
  
  // Modal actions
  openModal: (modal: keyof ModalState) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: true
      }
    }))
  },
  
  closeModal: (modal: keyof ModalState) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: false
      }
    }))
  },
  
  closeAllModals: () => {
    set({
      modals: {
        newProject: false,
        confirmDelete: false,
        viewRawJson: false,
        planningHelp: false,
        codegenProgress: false
      }
    })
  },
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration !== undefined ? toast.duration : 5000
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }
  },
  
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },
  
  clearToasts: () => {
    set({ toasts: [] })
  },
  
  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => {
    set({
      globalLoading: loading,
      loadingMessage: message || null
    })
  }
}))

// Initialize theme on store creation
const initialTheme = useUIStore.getState().theme
if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

export default useUIStore