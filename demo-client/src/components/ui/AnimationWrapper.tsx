// AnimationWrapper.tsx
// --------------------
// Wrapper component for adding consistent animations to any element
// Provides entrance animations, hover effects, and micro-interactions

import React from 'react'
import { styleUtils } from '../../styles/design-system'

interface AnimationWrapperProps {
  children: React.ReactNode
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'bounce'
  delay?: number
  duration?: number
  hover?: 'lift' | 'scale' | 'glow' | 'none'
  className?: string
}

export const AnimationWrapper: React.FC<AnimationWrapperProps> = ({
  children,
  animation = 'fade',
  delay = 0,
  duration = 300,
  hover = 'none',
  className
}) => {
  const animationClasses = {
    fade: 'animate-in fade-in',
    'slide-up': 'animate-in slide-in-from-bottom',
    'slide-down': 'animate-in slide-in-from-top',
    'slide-left': 'animate-in slide-in-from-right',
    'slide-right': 'animate-in slide-in-from-left',
    zoom: 'animate-in zoom-in',
    bounce: 'animate-in bounce-in'
  }
  
  const hoverClasses = {
    lift: 'hover-lift transform hover:-translate-y-1 hover:shadow-lg',
    scale: 'transform hover:scale-105 transition-transform duration-200',
    glow: 'hover:shadow-lg hover:shadow-primary-500/25 transition-shadow duration-200',
    none: ''
  }
  
  return (
    <div
      className={styleUtils.cn(
        animationClasses[animation],
        hoverClasses[hover],
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface StaggeredListProps {
  children: React.ReactNode[]
  staggerDelay?: number
  animation?: 'fade' | 'slide-up' | 'slide-left'
  className?: string
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  animation = 'slide-up',
  className
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimationWrapper
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </AnimationWrapper>
      ))}
    </div>
  )
}

interface FadeTransitionProps {
  show: boolean
  children: React.ReactNode
  className?: string
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  children,
  className
}) => {
  return (
    <div
      className={styleUtils.cn(
        'transition-all duration-300 ease-out',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  )
}

interface SlideTransitionProps {
  show: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
  children: React.ReactNode
  className?: string
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  direction = 'up',
  children,
  className
}) => {
  const directionClasses = {
    up: show ? 'translate-y-0' : 'translate-y-4',
    down: show ? 'translate-y-0' : '-translate-y-4',
    left: show ? 'translate-x-0' : 'translate-x-4',
    right: show ? 'translate-x-0' : '-translate-x-4'
  }
  
  return (
    <div
      className={styleUtils.cn(
        'transition-all duration-300 ease-out',
        show ? 'opacity-100' : 'opacity-0 pointer-events-none',
        directionClasses[direction],
        className
      )}
    >
      {children}
    </div>
  )
}

interface PulseEffectProps {
  children: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error'
  intensity?: 'subtle' | 'medium' | 'strong'
  className?: string
}

export const PulseEffect: React.FC<PulseEffectProps> = ({
  children,
  color = 'primary',
  intensity = 'medium',
  className
}) => {
  const colorClasses = {
    primary: 'shadow-primary-500/50',
    success: 'shadow-success-500/50',
    warning: 'shadow-warning-500/50',
    error: 'shadow-error-500/50'
  }
  
  const intensityClasses = {
    subtle: 'animate-pulse',
    medium: 'animate-pulse shadow-lg',
    strong: 'animate-pulse shadow-xl'
  }
  
  return (
    <div
      className={styleUtils.cn(
        intensityClasses[intensity],
        colorClasses[color],
        className
      )}
    >
      {children}
    </div>
  )
}

export default AnimationWrapper