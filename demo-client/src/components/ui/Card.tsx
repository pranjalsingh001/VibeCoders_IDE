import { PropsWithChildren } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'interactive'
  hover?: boolean
}

const Card = ({ 
  children, 
  className, 
  variant = 'default',
  hover = false 
}: CardProps) => {
  const variantClasses = {
    default: 'bg-white border border-secondary-200 shadow-sm',
    elevated: 'bg-white border border-secondary-200 shadow-md',
    interactive: 'bg-white border border-secondary-200 shadow-sm hover:shadow-md cursor-pointer'
  }
  
  return (
    <div 
      className={clsx(
        'rounded-lg p-6 transition-all duration-200 ease-out',
        variantClasses[variant],
        hover && 'hover-lift transform hover:scale-102',
        'animate-in fade-in slide-in-from-bottom duration-300',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
