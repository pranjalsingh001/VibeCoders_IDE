// ErrorHandlingDemo.tsx
// ---------------------
// Demo component showcasing the comprehensive error handling system
// This demonstrates all the error handling features implemented

import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { ConnectionStatus } from '../ui/ConnectionStatus'
import useErrorHandling from '../../hooks/useErrorHandling'
import useNetworkStatus from '../../hooks/useNetworkStatus'
import { validateFieldWithFeedback, commonValidations } from '../../utils/validation'

export const ErrorHandlingDemo: React.FC = () => {
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const { handleError, handleValidationError, retry, hasError, errorMessage, canRetry, isRecovering } = useErrorHandling({
    context: 'demo-form'
  })
  const networkStatus = useNetworkStatus()

  // Simulate different types of errors
  const simulateNetworkError = async () => {
    try {
      // This will fail and trigger error handling
      await fetch('/api/nonexistent-endpoint')
    } catch (error) {
      await handleError(error as Error, 'Failed to submit form')
    }
  }

  const simulateValidationError = () => {
    const emailValidation = handleValidationError(
      'email',
      email,
      commonValidations.email(true),
      'email'
    )
    
    const descValidation = handleValidationError(
      'description',
      description,
      commonValidations.description(),
      'description'
    )

    return { emailValidation, descValidation }
  }

  const throwJavaScriptError = () => {
    // This will be caught by the ErrorBoundary
    throw new Error('Simulated JavaScript error for ErrorBoundary demo')
  }

  const { emailValidation, descValidation } = simulateValidationError()

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Error Handling System Demo
        </h2>

        {/* Network Status Display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Network Status Monitoring
          </h3>
          <ConnectionStatus showDetails={true} />
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Connection Quality: {networkStatus.connectionQuality}</p>
            <p>Retry Count: {networkStatus.retryCount}</p>
            {networkStatus.lastConnected && (
              <p>Last Connected: {networkStatus.lastConnected.toLocaleTimeString()}</p>
            )}
          </div>
        </div>

        {/* Form with Validation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Form Validation with Error Handling
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  emailValidation.isValid
                    ? 'border-gray-300 focus:ring-blue-500'
                    : 'border-red-300 focus:ring-red-500'
                }`}
                placeholder="Enter your email"
              />
              {!emailValidation.isValid && emailValidation.error && (
                <p className="mt-1 text-sm text-red-600">{emailValidation.error}</p>
              )}
              {emailValidation.suggestion && (
                <p className="mt-1 text-sm text-blue-600">{emailValidation.suggestion}</p>
              )}
              {emailValidation.feedback && emailValidation.severity === 'info' && (
                <p className="mt-1 text-sm text-green-600">{emailValidation.feedback}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  descValidation.isValid
                    ? 'border-gray-300 focus:ring-blue-500'
                    : 'border-red-300 focus:ring-red-500'
                }`}
                placeholder="Enter a description (minimum 10 characters)"
              />
              {!descValidation.isValid && descValidation.error && (
                <p className="mt-1 text-sm text-red-600">{descValidation.error}</p>
              )}
              {descValidation.suggestion && (
                <p className="mt-1 text-sm text-blue-600">{descValidation.suggestion}</p>
              )}
              {descValidation.feedback && descValidation.severity === 'info' && (
                <p className="mt-1 text-sm text-green-600">{descValidation.feedback}</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Simulation Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Error Simulation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={simulateNetworkError}
              variant="secondary"
              disabled={isRecovering}
            >
              {isRecovering ? 'Recovering...' : 'Simulate Network Error'}
            </Button>
            
            <Button
              onClick={throwJavaScriptError}
              variant="secondary"
            >
              Trigger Error Boundary
            </Button>
            
            <Button
              onClick={() => networkStatus.retryConnection()}
              variant="secondary"
              disabled={networkStatus.isConnected}
            >
              Test Connection Retry
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Error Occurred
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {errorMessage}
            </p>
            {canRetry && (
              <Button
                onClick={() => retry()}
                size="sm"
                variant="secondary"
                disabled={isRecovering}
              >
                {isRecovering ? 'Retrying...' : 'Retry Operation'}
              </Button>
            )}
          </div>
        )}

        {/* Feature Status Based on Connection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Feature Availability
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Real-time Features</span>
              <span className={`px-2 py-1 rounded text-xs ${
                networkStatus.connectionQuality === 'good'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {networkStatus.connectionQuality === 'good' ? 'Available' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>File Uploads</span>
              <span className={`px-2 py-1 rounded text-xs ${
                networkStatus.isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {networkStatus.isConnected ? 'Available' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Heavy Operations</span>
              <span className={`px-2 py-1 rounded text-xs ${
                networkStatus.connectionQuality === 'good'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {networkStatus.connectionQuality === 'good' ? 'Available' : 'Limited'}
              </span>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>✅ Global Error Boundary: Catches unhandled JavaScript errors</p>
          <p>✅ Network Status Monitoring: Real-time connection quality detection</p>
          <p>✅ Automatic Error Recovery: Exponential backoff with intelligent retry</p>
          <p>✅ Offline Request Queuing: Requests queued when offline</p>
          <p>✅ Enhanced Validation: Context-aware error messages and suggestions</p>
          <p>✅ Connection Status Indicators: Visual feedback for network state</p>
        </div>
      </div>
    </div>
  )
}

export default ErrorHandlingDemo