// Loading.tsx
// -----------
// Enhanced loading components for various states and contexts
// Includes skeleton loaders, progress indicators, and smooth animations

import React from 'react'
import { Loader2, FileText, Code, Database, Layers } from 'lucide-react'
import { styleUtils, animations } from '../../styles/design-system'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  return (
    <Loader2 
      className={styleUtils.cn(
        'animate-spin text-primary-600',
        sizeClasses[size],
        className
      )} 
    />
  )
}

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div className={styleUtils.cn(
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <div>
            <p className="text-lg font-medium text-secondary-900">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  lines = 1 
}) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={styleUtils.cn(
            'bg-secondary-200 rounded',
            index > 0 && 'mt-2',
            className || 'h-4 w-full'
          )}
        />
      ))}
    </div>
  )
}

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  className,
  disabled,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={styleUtils.cn(
        'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md',
        'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        animations.transitions.fast,
        className
      )}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  description,
  className
}) => {
  return (
    <div className={styleUtils.cn(
      'bg-white rounded-lg border border-secondary-200 p-6 shadow-sm',
      className
    )}>
      <div className="flex items-center space-x-3 mb-4">
        <LoadingSpinner />
        <div>
          <h3 className="text-lg font-medium text-secondary-900">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-secondary-600 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <Skeleton lines={3} />
      </div>
    </div>
  )
}

// Simple Loading component that matches the interface used in WorkflowPage
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  className 
}) => {
  return <LoadingSpinner size={size} className={className} />
}

// Progress bar component
interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  color?: 'primary' | 'success' | 'warning' | 'error'
  label?: string
  animated?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = true,
  color = 'primary',
  label,
  animated = true
}) => {
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  }
  
  return (
    <div className={styleUtils.cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        {label && (
          <span className="text-sm font-medium text-secondary-900">
            {label}
          </span>
        )}
        {showPercentage && (
          <span className="text-sm font-medium text-secondary-700">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
        <div
          className={styleUtils.cn(
            'h-2 rounded-full transition-all duration-500 ease-out',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

// Enhanced skeleton components for specific use cases
interface WorkflowSkeletonProps {
  className?: string
}

export const WorkflowSkeleton: React.FC<WorkflowSkeletonProps> = ({ className }) => {
  return (
    <div className={styleUtils.cn('animate-pulse space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-secondary-200 rounded w-48"></div>
        <div className="h-10 bg-secondary-200 rounded w-32"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stepper skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary-200 rounded-full"></div>
              <div className="h-4 bg-secondary-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
        
        {/* Main content skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 bg-secondary-200 rounded w-3/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-secondary-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PlanningSkeletonProps {
  className?: string
}

export const PlanningSkeleton: React.FC<PlanningSkeletonProps> = ({ className }) => {
  return (
    <div className={styleUtils.cn('animate-pulse space-y-6', className)}>
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-secondary-200 rounded w-24"></div>
          <div className="h-4 bg-secondary-200 rounded w-12"></div>
        </div>
        <div className="h-2 bg-secondary-200 rounded w-full"></div>
      </div>
      
      {/* Question skeleton */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6 space-y-4">
        <div className="h-6 bg-secondary-200 rounded w-3/4"></div>
        <div className="h-4 bg-secondary-200 rounded w-1/2"></div>
        <div className="h-32 bg-secondary-200 rounded w-full"></div>
        
        {/* Navigation buttons skeleton */}
        <div className="flex justify-between pt-4">
          <div className="h-10 bg-secondary-200 rounded w-20"></div>
          <div className="flex space-x-3">
            <div className="h-10 bg-secondary-200 rounded w-24"></div>
            <div className="h-10 bg-secondary-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AIResponseSkeletonProps {
  className?: string
  type?: 'blueprint' | 'hld' | 'lld'
}

export const AIResponseSkeleton: React.FC<AIResponseSkeletonProps> = ({ 
  className, 
  type = 'blueprint' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'blueprint':
        return <FileText className="w-6 h-6 text-secondary-400" />
      case 'hld':
        return <Layers className="w-6 h-6 text-secondary-400" />
      case 'lld':
        return <Code className="w-6 h-6 text-secondary-400" />
      default:
        return <FileText className="w-6 h-6 text-secondary-400" />
    }
  }
  
  return (
    <div className={styleUtils.cn('animate-pulse space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div className="h-7 bg-secondary-200 rounded w-48"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-9 bg-secondary-200 rounded w-24"></div>
          <div className="h-9 bg-secondary-200 rounded w-20"></div>
        </div>
      </div>
      
      {/* Content sections */}
      <div className="space-y-6">
        {/* Tech stack badges */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-secondary-200 rounded-full w-16"></div>
          ))}
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-5 bg-secondary-200 rounded w-32"></div>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-secondary-200 rounded w-full"></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-5 bg-secondary-200 rounded w-40"></div>
            <div className="h-48 bg-secondary-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CodeGenSkeletonProps {
  className?: string
}

export const CodeGenSkeleton: React.FC<CodeGenSkeletonProps> = ({ className }) => {
  return (
    <div className={styleUtils.cn('animate-pulse space-y-6', className)}>
      {/* Progress overview */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-secondary-200 rounded w-48"></div>
          <div className="h-8 bg-secondary-200 rounded w-24"></div>
        </div>
        <div className="h-2 bg-secondary-200 rounded w-full"></div>
      </div>
      
      {/* File manifest table */}
      <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200">
          <div className="h-6 bg-secondary-200 rounded w-32"></div>
        </div>
        
        <div className="divide-y divide-secondary-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-secondary-200 rounded"></div>
                <div className="h-4 bg-secondary-200 rounded w-48"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-6 bg-secondary-200 rounded-full w-20"></div>
                <div className="h-8 bg-secondary-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Animated loading states for specific operations
interface OperationLoadingProps {
  operation: 'generating' | 'parsing' | 'validating' | 'saving'
  message?: string
  className?: string
}

export const OperationLoading: React.FC<OperationLoadingProps> = ({
  operation,
  message,
  className
}) => {
  const getOperationConfig = () => {
    switch (operation) {
      case 'generating':
        return {
          icon: <Code className="w-6 h-6 text-primary-600" />,
          defaultMessage: 'Generating code...',
          color: 'primary'
        }
      case 'parsing':
        return {
          icon: <FileText className="w-6 h-6 text-warning-600" />,
          defaultMessage: 'Parsing response...',
          color: 'warning'
        }
      case 'validating':
        return {
          icon: <Database className="w-6 h-6 text-success-600" />,
          defaultMessage: 'Validating files...',
          color: 'success'
        }
      case 'saving':
        return {
          icon: <Layers className="w-6 h-6 text-secondary-600" />,
          defaultMessage: 'Saving changes...',
          color: 'secondary'
        }
      default:
        return {
          icon: <Loader2 className="w-6 h-6 text-primary-600" />,
          defaultMessage: 'Processing...',
          color: 'primary'
        }
    }
  }
  
  const config = getOperationConfig()
  
  return (
    <div className={styleUtils.cn(
      'flex items-center justify-center p-8 bg-white rounded-lg border border-secondary-200',
      className
    )}>
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-bounce">
            {config.icon}
          </div>
        </div>
        <div>
          <p className="text-lg font-medium text-secondary-900">
            {message || config.defaultMessage}
          </p>
          <div className="mt-2 flex justify-center">
            <div className="flex space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={styleUtils.cn(
                    'w-2 h-2 rounded-full animate-pulse',
                    `bg-${config.color}-600`
                  )}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}