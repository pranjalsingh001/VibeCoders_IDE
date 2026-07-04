// ProtectedRoute.test.tsx
// Unit tests for ProtectedRoute component

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import useAuthStore from '../../stores/authStore'

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  default: vi.fn()
}))

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>)
  }
})

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when user is authenticated', () => {
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

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
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

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
  })

  it('should show loading state when authentication is loading', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      token: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      setToken: vi.fn(),
      clearError: vi.fn()
    })

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('should handle authentication state changes', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore)
    
    // Initially not authenticated
    mockUseAuthStore.mockReturnValue({
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

    const { rerender } = renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should redirect to login
    expect(screen.getByTestId('navigate')).toBeInTheDocument()

    // Update to authenticated
    mockUseAuthStore.mockReturnValue({
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

    rerender(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should now show protected content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })
})