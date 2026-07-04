import React from 'react'
import { Loader2 } from 'lucide-react'
import { styleUtils, componentVariants, animations } from '../../styles/design-system'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  fullWidth = false,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  const baseClasses = clsx(
    'inline-flex items-center justify-center font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out',
    'transform hover:scale-105 active:scale-98 press-effect',
    'hover-lift focus-ring'
  )
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg text-white border-transparent focus:ring-primary-500',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 hover:shadow-md text-secondary-900 border-secondary-300 focus:ring-secondary-500',
    outline: 'bg-transparent hover:bg-primary-50 hover:shadow-sm text-primary-600 border-primary-600 focus:ring-primary-500',
    ghost: 'bg-transparent hover:bg-secondary-100 hover:shadow-sm text-secondary-700 border-transparent focus:ring-secondary-500',
    danger: 'bg-error-600 hover:bg-error-700 hover:shadow-lg text-white border-transparent focus:ring-error-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && (
        <Loader2 className={clsx(
          'animate-spin mr-2',
          iconSizeClasses[size]
        )} />
      )}
      
      {!loading && leftIcon && (
        <span className={clsx(
          'mr-2',
          iconSizeClasses[size]
        )}>
          {leftIcon}
        </span>
      )}
      
      <span>{children}</span>
      
      {!loading && rightIcon && (
        <span className={clsx(
          'ml-2',
          iconSizeClasses[size]
        )}>
          {rightIcon}
        </span>
      )}
    </button>
  )
}

export { Button }
export default Button
