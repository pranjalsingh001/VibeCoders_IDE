// ConnectionStatus.tsx
// --------------------
// Connection status indicator component
// Shows network status and provides retry functionality

import React from 'react'
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import useNetworkStatus, { networkUtils } from '../../hooks/useNetworkStatus'
import { cn } from '../../utils/cn'

interface ConnectionStatusProps {
  className?: string
  showDetails?: boolean
  showRetryButton?: boolean
  compact?: boolean
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showDetails = false,
  showRetryButton = true,
  compact = false
}) => {
  const networkStatus = useNetworkStatus()
  const { retryConnection } = networkStatus

  const statusMessage = networkUtils.getStatusMessage(networkStatus)
  const statusIcon = networkUtils.getStatusIcon(networkStatus)

  const getStatusColor = () => {
    if (!networkStatus.isOnline || !networkStatus.isConnected) {
      return 'text-red-600 dark:text-red-400'
    }
    
    switch (networkStatus.connectionQuality) {
      case 'good':
        return 'text-green-600 dark:text-green-400'
      case 'poor':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusBgColor = () => {
    if (!networkStatus.isOnline || !networkStatus.isConnected) {
      return 'bg-red-100 dark:bg-red-900/20'
    }
    
    switch (networkStatus.connectionQuality) {
      case 'good':
        return 'bg-green-100 dark:bg-green-900/20'
      case 'poor':
        return 'bg-yellow-100 dark:bg-yellow-900/20'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getIcon = () => {
    if (!networkStatus.isOnline || !networkStatus.isConnected) {
      return <WifiOff className="w-4 h-4" />
    }
    
    if (networkStatus.connectionQuality === 'poor') {
      return <AlertTriangle className="w-4 h-4" />
    }
    
    return <Wifi className="w-4 h-4" />
  }

  if (compact) {
    return (
      <div className={cn(
        'flex items-center space-x-2 px-2 py-1 rounded-md text-sm',
        getStatusBgColor(),
        className
      )}>
        <span className={getStatusColor()}>
          {getIcon()}
        </span>
        <span className={cn('text-xs', getStatusColor())}>
          {statusMessage}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border',
      getStatusBgColor(),
      'border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center space-x-3">
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full',
          getStatusBgColor()
        )}>
          <span className={getStatusColor()}>
            {getIcon()}
          </span>
        </div>
        
        <div>
          <div className={cn('font-medium text-sm', getStatusColor())}>
            {statusMessage}
          </div>
          
          {showDetails && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {networkStatus.lastConnected && (
                <span>
                  Last connected: {networkStatus.lastConnected.toLocaleTimeString()}
                </span>
              )}
              {networkStatus.retryCount > 0 && (
                <span className="ml-2">
                  Retries: {networkStatus.retryCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {showRetryButton && (!networkStatus.isOnline || !networkStatus.isConnected) && (
        <Button
          onClick={retryConnection}
          variant="secondary"
          size="sm"
          className="ml-3"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

// Minimal status indicator for headers/toolbars
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const networkStatus = useNetworkStatus()
  
  if (networkStatus.isOnline && networkStatus.isConnected && networkStatus.connectionQuality === 'good') {
    return null // Don't show indicator when everything is fine
  }

  const getIndicatorColor = () => {
    if (!networkStatus.isOnline || !networkStatus.isConnected) {
      return 'bg-red-500'
    }
    return 'bg-yellow-500'
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', getIndicatorColor())} />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {networkUtils.getStatusMessage(networkStatus)}
      </span>
    </div>
  )
}

export default ConnectionStatus