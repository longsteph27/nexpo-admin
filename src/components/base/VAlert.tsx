import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  html?: string | TrustedHTML
  children?: React.ReactNode
}

const iconMap = {
  info: 'heroicons:information-circle-solid',
  success: 'heroicons:check-circle-solid',
  warning: 'heroicons:exclamation-triangle-solid',
  error: 'heroicons:x-circle-solid',
}

const variantMap = {
  info: 'default',
  success: 'default',
  warning: 'default',
  error: 'destructive',
} as const

function VAlert(props: AlertProps) {
  const { type = 'info', html, children } = props

  const colorClasses = {
    info: 'border-blue-500 text-blue-800 dark:text-blue-200',
    success: 'border-green-500 text-green-800 dark:text-green-200',
    warning: 'border-amber-500 text-amber-800 dark:text-amber-200',
    error: 'border-rose-500',
  }

  const iconColorClasses = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-amber-500',
    error: 'text-rose-500',
  }

  return (
    <Alert 
      variant={variantMap[type]}
      className={cn(
        'border-2 rounded-tr-xl rounded-bl-xl',
        colorClasses[type]
      )}
    >
      <Icon
        icon={iconMap[type]}
        className={cn('w-6 h-6', iconColorClasses[type])}
        aria-hidden='true'
      />
      <AlertDescription className="font-mono">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          children
        )}
      </AlertDescription>
    </Alert>
  )
}

export default VAlert

