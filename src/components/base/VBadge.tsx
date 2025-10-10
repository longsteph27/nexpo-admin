import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getContrastColor } from '@/lib/utils/color'
import { cn } from '@/lib/utils'

interface BadgeProps {
  color?: string
  size?: string
  className?: string
  children?: React.ReactNode
}

function VBadge({
  color = 'default',
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  // If a custom hex color is provided, use it with dynamic contrast
  if (color && color.startsWith('#')) {
    return (
      <Badge
        style={{
          backgroundColor: color,
          color: getContrastColor(color),
        }}
        className={cn(
          'inline-flex items-center font-serif font-medium',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5',
          className
        )}
      >
        {children}
      </Badge>
    )
  }

  // Use predefined color variants
  const variantMap: Record<string, any> = {
    default: 'default',
    gray: 'secondary',
    green: 'default',
    purple: 'default',
    blue: 'default',
    amber: 'default',
    orange: 'default',
    red: 'destructive',
    indigo: 'default',
    violet: 'default',
    pink: 'default',
    yellow: 'default',
  }

  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-content-primary',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    orange: 'bg-orange-100 text-orange-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    violet: 'bg-violet-100 text-violet-800',
    pink: 'bg-primary-100 text-accent',
    yellow: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <Badge
      variant={variantMap[color] || 'default'}
      className={cn(
        'inline-flex items-center font-serif font-medium',
        colorClasses[color],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5',
        className
      )}
    >
      {children}
    </Badge>
  )
}

export default VBadge

