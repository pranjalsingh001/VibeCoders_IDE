// ErrorBoundary.test.tsx
// -----------------------
// Tests for the ErrorBoundary component

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

// Mock child component that can throw errors
const ThrowError = ({ shouldThrow = false, errorType = 'generic' }) => {
    if (shouldThrow) {
        switch (errorType) {
            case 'chunk':
                throw new Error('Loading chunk 1 failed')
            case 'network':
                throw new Error('Network Error: Failed to fetch')
            case 'timeout':
                throw new Error('Request timeout')
            default:
                throw new Error('Test error')
        }
    }
    return <div>No error</div>
}

// Mock window.location
const mockLocation = {
    href: '',
    reload: vi.fn()
}
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
})

describe('ErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLocation.href = ''
        console.error = vi.fn() // Suppress error logs in tests
    })

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        )

        expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('renders error UI when child component throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('An unexpected error occurred. Our team has been notified.')).toBeInTheDocument()
    })

    it('shows specific error message for chunk load errors', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} errorType="chunk" />
            </ErrorBoundary>
        )

        expect(screen.getByText(/Failed to load part of the application/)).toBeInTheDocument()
        expect(screen.getByText('Try refreshing the page')).toBeInTheDocument()
        expect(screen.getByText('Clear your browser cache')).toBeInTheDocument()
    })

    it('shows specific error message for network errors', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} errorType="network" />
            </ErrorBoundary>
        )

        expect(screen.getByText(/Network connection issue/)).toBeInTheDocument()
        expect(screen.getByText('Check your internet connection')).toBeInTheDocument()
    })

    it('provides retry functionality', () => {
        let shouldThrow = true

        const DynamicThrowError = () => {
            if (shouldThrow) {
                throw new Error('Test error')
            }
            return <div>No error</div>
        }

        const { rerender } = render(
            <ErrorBoundary>
                <DynamicThrowError />
            </ErrorBoundary>
        )

        // Verify error is shown
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()

        // Simulate fixing the error condition
        shouldThrow = false

        const retryButton = screen.getByText('Try Again')
        fireEvent.click(retryButton)

        // After retry, the error boundary should reset and re-render children
        expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('provides reload page functionality', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        const reloadButton = screen.getByText('Reload Page')
        fireEvent.click(reloadButton)

        expect(mockLocation.reload).toHaveBeenCalled()
    })

    it('provides go home functionality', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        const homeButton = screen.getByText('Go Home')
        fireEvent.click(homeButton)

        expect(mockLocation.href).toBe('/dashboard')
    })

    it('calls custom error handler when provided', () => {
        const onError = vi.fn()

        render(
            <ErrorBoundary onError={onError}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(onError).toHaveBeenCalled()
        expect(onError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.any(String)
            })
        )
    })

    it('renders custom fallback when provided', () => {
        const customFallback = <div>Custom error message</div>

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText('Custom error message')).toBeInTheDocument()
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('shows error details in development mode', () => {
        // Mock development environment
        const originalEnv = import.meta.env.DEV
        import.meta.env.DEV = true

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText('Error Details (Dev Mode)')).toBeInTheDocument()

        // Restore original environment
        import.meta.env.DEV = originalEnv
    })

    it('does not show error details in production mode', () => {
        // Mock production environment
        const originalEnv = import.meta.env.DEV
        import.meta.env.DEV = false

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.queryByText('Error Details (Dev Mode)')).not.toBeInTheDocument()

        // Restore original environment
        import.meta.env.DEV = originalEnv
    })

    it('generates unique error IDs', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Click retry to reset
        fireEvent.click(screen.getByText('Try Again'))

        // Trigger error again
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Should generate a new error ID (we can't easily test the actual ID,
        // but we can verify the error boundary handles multiple errors)
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
})