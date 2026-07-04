// Badge.tsx
// ---------
// Badge component for status indicators and labels

import React from 'react'
import clsx from 'clsx'
import { componentVariants } from '../../styles/design-system'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  dot?: boolean
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  dot = false
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border'
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  }
  
  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  }
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
    success: 'bg-success-100 text-success-800 border-success-200',
    warning: 'bg-warning-100 text-warning-800 border-warning-200',
    error: 'bg-error-100 text-error-800 border-error-200'
  }
  
  const dotVariantClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  }
  
  return (
    <span
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'rounded-full mr-1.5',
            dotSizeClasses[size],
            dotVariantClasses[variant]
          )}
        />
      )}
      {children}
    </span>
  )
}

// Status badge specifically for workflow stages
interface StatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    not_started: {
      variant: 'secondary' as const,
      label: 'Not Started',
      dot: false
    },
    in_progress: {
      variant: 'warning' as const,
      label: 'In Progress',
      dot: true
    },
    completed: {
      variant: 'success' as const,
      label: 'Completed',
      dot: false
    },
    failed: {
      variant: 'error' as const,
      label: 'Failed',
      dot: false
    }
  }
  
  const config = statusConfig[status]
  
  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

// Tech stack badge for displaying technologies
interface TechBadgeProps {
  tech: string
  className?: string
}

export const TechBadge: React.FC<TechBadgeProps> = ({ tech, className }) => {
  // Map common technologies to colors
  const techColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
    'React': 'primary',
    'Node.js': 'success',
    'TypeScript': 'primary',
    'JavaScript': 'warning',
    'Python': 'success',
    'MongoDB': 'success',
    'PostgreSQL': 'primary',
    'Express': 'secondary',
    'Next.js': 'secondary',
    'Vue.js': 'success',
    'Angular': 'error',
    'Docker': 'primary',
    'AWS': 'warning',
    'Firebase': 'warning'
  }
  
  const variant = techColors[tech] || 'secondary'
  
  return (
    <Badge variant={variant} size="sm" className={className}>
      {tech}
    </Badge>
  )
}

export default Badge