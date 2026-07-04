// App.test.tsx
// Unit tests for App component routing

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import useUIStore from '../stores/uiStore'
import useAuthStore from '../stores/authStore'

// Mock all the page components
vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('../pages/SignupPage', () => ({
  default: () => <div data-testid="signup-page">Signup Page</div>
}))

vi.mock('../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}))

vi.mock('../pages/WorkspacePage', () => ({
  default: () => <div data-testid="workspace-page">Workspace Page</div>
}))

vi.mock('../pages/WorkflowPage', () => ({
  default: () => <div data-testid="workflow-page">Workflow Page</div>
}))

vi.mock('../pages/NotFoundPage', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>
}))

// Mock ProtectedRoute
vi.mock('../router/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuthStore()
    return isAuthenticated ? <>{children}</> : <div data-testid="redirect-login">Redirect to Login</div>
  }
}))

// Mock UI components
vi.mock('../components/ui/Toast', () => ({
  ToastContainer: () => <div data-testid="toast-container">Toast Container</div>
}))

vi.mock('../components/ui/Loading', () => ({
  LoadingOverlay: ({ message }: { message?: string }) => (
    <div data-testid="loading-overlay">
      Loading Overlay {message && `- ${message}`}
    </div>
  )
}))

// Mock stores
vi.mock('../stores/uiStore', () => ({
  default: vi.fn()
}))

vi.mock('../stores/authStore', () => ({
  default: vi.fn()
}))

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  )
}

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default UI store state
    vi.mocked(useUIStore).mockReturnValue({
      globalLoading: false,
      loadingMessage: null,
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
      setTheme: vi.fn(),
      toggleSidebar: vi.fn(),
      setSidebarCollapsed: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      closeAllModals: vi.fn(),
      addToast: vi.fn(),
      removeToast: vi.fn(),
      clearToasts: vi.fn(),
      setGlobalLoading: vi.fn(),
    })

    // Default auth store state (not authenticated)
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      token: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      setToken: vi.fn(),
      clearError: vi.fn()
    })
  })

  describe('Public Routes', () => {
    it('should render login page', () => {
      renderWithRouter(['/login'])
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('should render signup page', () => {
      renderWithRouter(['/signup'])
      expect(screen.getByTestId('signup-page')).toBeInTheDocument()
    })

    it('should render not found page for invalid routes', () => {
      renderWithRouter(['/invalid-route'])
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })

  describe('Protected Routes', () => {
    beforeEach(() => {
      // Set authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        clearError: vi.fn()
      })
    })

    it('should render dashboard page when authenticated', () => {
      renderWithRouter(['/dashboard'])
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })

    it('should render workflow page when authenticated', () => {
      renderWithRouter(['/projects/123/workflow'])
      expect(screen.getByTestId('workflow-page')).toBeInTheDocument()
    })

    it('should render workspace page when authenticated', () => {
      renderWithRouter(['/projects/123/workspace'])
      expect(screen.getByTestId('workspace-page')).toBeInTheDocument()
    })

    it('should redirect root path to dashboard', () => {
      renderWithRouter(['/'])
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  describe('Protected Routes - Unauthenticated', () => {
    it('should redirect to login for protected dashboard route', () => {
      renderWithRouter(['/dashboard'])
      expect(screen.getByTestId('redirect-login')).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
    })

    it('should redirect to login for protected workflow route', () => {
      renderWithRouter(['/projects/123/workflow'])
      expect(screen.getByTestId('redirect-login')).toBeInTheDocument()
      expect(screen.queryByTestId('workflow-page')).not.toBeInTheDocument()
    })

    it('should redirect to login for protected workspace route', () => {
      renderWithRouter(['/projects/123/workspace'])
      expect(screen.getByTestId('redirect-login')).toBeInTheDocument()
      expect(screen.queryByTestId('workspace-page')).not.toBeInTheDocument()
    })
  })

  describe('Global UI Components', () => {
    it('should always render toast container', () => {
      renderWithRouter(['/login'])
      expect(screen.getByTestId('toast-container')).toBeInTheDocument()
    })

    it('should render loading overlay when global loading is true', () => {
      vi.mocked(useUIStore).mockReturnValue({
        globalLoading: true,
        loadingMessage: 'Loading data...',
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
        setTheme: vi.fn(),
        toggleSidebar: vi.fn(),
        setSidebarCollapsed: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
        addToast: vi.fn(),
        removeToast: vi.fn(),
        clearToasts: vi.fn(),
        setGlobalLoading: vi.fn(),
      })

      renderWithRouter(['/login'])
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
      expect(screen.getByText('Loading Overlay - Loading data...')).toBeInTheDocument()
    })

    it('should not render loading overlay when global loading is false', () => {
      renderWithRouter(['/login'])
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument()
    })

    it('should render loading overlay without message', () => {
      vi.mocked(useUIStore).mockReturnValue({
        globalLoading: true,
        loadingMessage: null,
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
        setTheme: vi.fn(),
        toggleSidebar: vi.fn(),
        setSidebarCollapsed: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
        addToast: vi.fn(),
        removeToast: vi.fn(),
        clearToasts: vi.fn(),
        setGlobalLoading: vi.fn(),
      })

      renderWithRouter(['/login'])
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
      expect(screen.getByText('Loading Overlay')).toBeInTheDocument()
    })
  })

  describe('Route Parameters', () => {
    beforeEach(() => {
      // Set authenticated state for protected routes
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        clearError: vi.fn()
      })
    })

    it('should handle workflow route with project ID parameter', () => {
      renderWithRouter(['/projects/abc123/workflow'])
      expect(screen.getByTestId('workflow-page')).toBeInTheDocument()
    })

    it('should handle workspace route with project ID parameter', () => {
      renderWithRouter(['/projects/xyz789/workspace'])
      expect(screen.getByTestId('workspace-page')).toBeInTheDocument()
    })

    it('should handle different project ID formats', () => {
      renderWithRouter(['/projects/project-with-dashes/workflow'])
      expect(screen.getByTestId('workflow-page')).toBeInTheDocument()
    })
  })
})