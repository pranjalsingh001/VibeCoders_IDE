// components/ui/StatusBadge.tsx
// -----------------------------
// Status badge component for project status display

import React from 'react'

interface StatusBadgeProps {
  status: string
  color: 'green' | 'blue' | 'purple' | 'gray' | 'yellow' | 'red'
  size?: 'sm' | 'md'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, color, size = 'sm' }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200', 
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${colorClasses[color]}
      ${sizeClasses[size]}
    `}>
      {status}
    </span>
  )
}

export default StatusBadge