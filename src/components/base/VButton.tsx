'use client'
import { cn } from '@/lib/utils'
import { Link } from '@/lib/navigation'
import React from 'react'
import { Button } from '@/components/ui/button-base'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button-base'

interface VButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  href?: string
  target?: string
  loading?: boolean
  block?: boolean
  color?: 'primary' | 'gray' | 'black' | 'white'
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | string
  children: React.ReactNode
}

// Color and variant classes to maintain backward compatibility with original VButton
function getButtonColorClass(color: string, variant: string) {
  if (variant === 'solid') {
    if (color === 'primary' || null) return 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90'
    if (color === 'gray') return 'bg-gray-400 text-white hover:bg-gray-500'
    if (color === 'black') return 'bg-black text-white hover:bg-gray-800'
    if (color === 'white') return 'bg-white text-black hover:bg-gray-100 border border-gray-300'
  }
  if (variant === 'outline') {
    if (color === 'primary') return 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
    if (color === 'gray') return 'border-gray-400 text-gray-700 hover:bg-gray-100'
    if (color === 'black') return 'border-black text-black hover:bg-gray-100'
    if (color === 'white') return 'border-white text-white hover:bg-gray-100'
  }
  if (variant === 'link') {
    if (color === 'primary') return 'text-[var(--color-primary)] hover:text-[var(--color-primary)]/80'
    if (color === 'gray') return 'text-gray-700 hover:text-gray-900'
    if (color === 'black') return 'text-black hover:text-gray-800'
    if (color === 'white') return 'text-white hover:text-gray-200'
  }
  return ''
}

function VButton(props: VButtonProps) {
  const {
    type = 'button',
    variant = 'solid',
    size = 'default',
    loading,
    disabled,
    block,
    target,
    href,
    color = 'primary',
    children,
    className,
    onClick,
    ...rest
  } = props

  // Use custom color classes if color prop is provided, otherwise use shadcn variants
  const useCustomColors = color !== 'primary' || variant === 'solid'
  const customColorClass = useCustomColors ? getButtonColorClass(color, variant) : ''
  
  // Map to shadcn variants only if not using custom colors
  const mappedVariant = !useCustomColors && variant === 'solid' ? 'default' : 
                        variant === 'outline' ? 'outline' :
                        variant === 'ghost' ? 'ghost' :
                        variant === 'link' ? 'link' : 'default'

  const sizeMap = {
    xs: 'sm',
    sm: 'sm', 
    md: 'default',
    lg: 'lg',
    xl: 'lg',
  } as const

  const mappedSize = sizeMap[size as keyof typeof sizeMap] || size

  const buttonClasses = cn(
    'btn',
    size ? `btn-${size}` : '',
    block && 'w-full',
    customColorClass,
    className
  )

  if (href) {
    return (
      <Link
        href={href as any}
        target={target}
        className={buttonClasses}
        onClick={onClick as any}
      >
        {children}
      </Link>
    )
  }

  return (
    <Button
      className={cn(
        useCustomColors ? buttonClasses : cn(buttonVariants({ variant: mappedVariant as any, size: mappedSize as any }), block && 'w-full', className)
      )}
      disabled={disabled || loading}
      type={type as any}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Button>
  )
}

export default VButton

