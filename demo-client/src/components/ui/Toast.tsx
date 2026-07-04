// Toast.tsx
// ---------
// Toast notification component with auto-dismiss and action support

import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import useUIStore, { Toast as ToastType } from '../../stores/uiStore'
import { styleUtils, componentVariants, animations } from '../../styles/design-system'

interface ToastProps {
  toast: ToastType
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useUIStore()
  
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
      
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, removeToast])
  
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'info':
        return <Info className="w-5 h-5 text-primary-600" />
      default:
        return <Info className="w-5 h-5 text-primary-600" />
    }
  }
  
  const getToastStyles = () => {
    const baseStyles = 'flex items-start p-4 rounded-lg shadow-lg border max-w-sm w-full'
    
    switch (toast.type) {
      case 'success':
        return styleUtils.cn(baseStyles, 'bg-success-50 border-success-200')
      case 'error':
        return styleUtils.cn(baseStyles, 'bg-error-50 border-error-200')
      case 'warning':
        return styleUtils.cn(baseStyles, 'bg-warning-50 border-warning-200')
      case 'info':
        return styleUtils.cn(baseStyles, 'bg-primary-50 border-primary-200')
      default:
        return styleUtils.cn(baseStyles, 'bg-white border-secondary-200')
    }
  }
  
  return (
    <div className={styleUtils.cn(
      getToastStyles(), 
      animations.transitions.normal, 
      'transform transition-all duration-300 ease-out',
      'animate-in slide-in-from-right-full fade-in',
      'hover:scale-105 hover:shadow-lg'
    )}>
      <div className="flex-shrink-0 mr-3 mt-0.5">
        <div className="animate-in zoom-in duration-200 delay-100">
          {getIcon()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900 animate-in fade-in duration-300 delay-150">
          {toast.message}
        </p>
        
        {toast.actions && toast.actions.length > 0 && (
          <div className="mt-3 flex space-x-2 animate-in slide-in-from-bottom duration-200 delay-200">
            {toast.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  removeToast(toast.id)
                }}
                className={styleUtils.cn(
                  'text-xs font-medium px-3 py-1.5 rounded-md',
                  'transform transition-all duration-150 ease-out',
                  'hover:scale-105 active:scale-95',
                  action.variant === 'primary'
                    ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 hover:shadow-sm',
                  animations.transitions.fast
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button
        onClick={() => removeToast(toast.id)}
        className={styleUtils.cn(
          'flex-shrink-0 ml-3 p-1.5 rounded-md text-secondary-400 hover:text-secondary-600',
          'transform transition-all duration-150 ease-out',
          'hover:scale-110 hover:bg-secondary-100 active:scale-95',
          animations.transitions.fast
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast container component with enhanced positioning and animations
export const ToastContainer: React.FC = () => {
  const { toasts } = useUIStore()
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      <div className="space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto transform transition-all duration-300 ease-out"
            style={{
              transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
              zIndex: 50 - index
            }}
          >
            <Toast toast={toast} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Toast