// ProgressIndicator.tsx
// ---------------------
// Enhanced progress indicators for long-running operations
// Includes circular progress, step progress, and animated indicators

import React from 'react'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { styleUtils } from '../../styles/design-system'

interface CircularProgressProps {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'success' | 'warning' | 'error'
  showPercentage?: boolean
  className?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 'md',
  color = 'primary',
  showPercentage = true,
  className
}) => {
  const sizeClasses = {
    sm: { container: 'w-12 h-12', text: 'text-xs' },
    md: { container: 'w-16 h-16', text: 'text-sm' },
    lg: { container: 'w-20 h-20', text: 'text-base' },
    xl: { container: 'w-24 h-24', text: 'text-lg' }
  }
  
  const colorClasses = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600'
  }
  
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return (
    <div className={styleUtils.cn(
      'relative inline-flex items-center justify-center',
      sizeClasses[size].container,
      className
    )}>
      <svg
        className="transform -rotate-90 w-full h-full"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-secondary-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={styleUtils.cn(
            'transition-all duration-500 ease-out',
            colorClasses[color]
          )}
        />
      </svg>
      
      {showPercentage && (
        <div className={styleUtils.cn(
          'absolute inset-0 flex items-center justify-center font-semibold',
          sizeClasses[size].text,
          colorClasses[color]
        )}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}

interface StepProgressProps {
  steps: Array<{
    id: string
    label: string
    status: 'pending' | 'active' | 'completed' | 'error'
  }>
  className?: string
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, className }) => {
  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'active':
        return <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-600" />
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-secondary-300 bg-white flex items-center justify-center">
            <span className="text-xs font-medium text-secondary-600">{index + 1}</span>
          </div>
        )
    }
  }
  
  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-700'
      case 'active':
        return 'text-primary-700 font-medium'
      case 'error':
        return 'text-error-700'
      default:
        return 'text-secondary-600'
    }
  }
  
  return (
    <div className={styleUtils.cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          {/* Connection line */}
          {index < steps.length - 1 && (
            <div className="absolute left-2.5 top-8 w-0.5 h-8 bg-secondary-200">
              {step.status === 'completed' && (
                <div className="w-full h-full bg-success-400 animate-in slide-in-from-top duration-300" />
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getStepIcon(step.status, index)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={styleUtils.cn(
                'text-sm transition-colors duration-200',
                getStepClasses(step.status)
              )}>
                {step.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = ''
}) => {
  const [displayValue, setDisplayValue] = React.useState(0)
  
  React.useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(easeOutQuart * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])
  
  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

interface PulsingDotProps {
  color?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  color = 'primary',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }
  
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  }
  
  return (
    <div className={styleUtils.cn('relative inline-flex', className)}>
      <div className={styleUtils.cn(
        'rounded-full animate-ping absolute inline-flex opacity-75',
        sizeClasses[size],
        colorClasses[color]
      )} />
      <div className={styleUtils.cn(
        'rounded-full relative inline-flex',
        sizeClasses[size],
        colorClasses[color]
      )} />
    </div>
  )
}

interface LoadingDotsProps {
  color?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  color = 'primary',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }
  
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  }
  
  return (
    <div className={styleUtils.cn('flex space-x-1', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={styleUtils.cn(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )
}