// ErrorBoundary.tsx
// -----------------
// Global error boundary component with user-friendly error messages
// Catches JavaScript errors anywhere in the component tree

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This would typically send to an error reporting service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    }

    console.log('Error report:', errorReport)
    
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorReport })
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  private handleReload = () => {
    window.location.reload()
  }

  private getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages based on error type
    if (error.name === 'ChunkLoadError') {
      return 'Failed to load application resources. This might be due to a network issue or an app update.'
    }
    
    if (error.message.includes('Loading chunk')) {
      return 'Failed to load part of the application. This might be due to a network issue.'
    }
    
    if (error.message.includes('Network Error')) {
      return 'Network connection issue. Please check your internet connection.'
    }
    
    if (error.message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.'
    }
    
    // Generic fallback
    return 'An unexpected error occurred. Our team has been notified.'
  }

  private getSuggestions = (error: Error): string[] => {
    const suggestions: string[] = []
    
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      suggestions.push('Try refreshing the page')
      suggestions.push('Check your internet connection')
      suggestions.push('Clear your browser cache')
    } else if (error.message.includes('Network Error')) {
      suggestions.push('Check your internet connection')
      suggestions.push('Try again in a few moments')
    } else {
      suggestions.push('Try refreshing the page')
      suggestions.push('Go back to the dashboard')
      suggestions.push('Contact support if the problem persists')
    }
    
    return suggestions
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const error = this.state.error!
      const errorMessage = this.getErrorMessage(error)
      const suggestions = this.getSuggestions(error)

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {errorMessage}
            </p>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Try these solutions:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={this.handleReload}
                  variant="secondary"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="secondary"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Bug className="w-4 h-4 mr-1" />
                  Error Details (Dev Mode)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo)
    
    // In production, report to error service
    if (import.meta.env.PROD) {
      // errorReportingService.captureException(error, { extra: errorInfo })
    }
    
    // You could also trigger a toast notification here
    // const uiStore = useUIStore.getState()
    // uiStore.addToast({
    //   type: 'error',
    //   message: 'An error occurred. Please try again.',
    //   duration: 5000
    // })
  }

  return { handleError }
}

export default ErrorBoundary