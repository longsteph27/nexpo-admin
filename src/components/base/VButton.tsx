'use client'
import { cn } from '@/lib/utils'
import { Link } from '@/lib/navigation'
import React from 'react'
import { Button } from '@/components/ui/button-base'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button-base'

import { getButtonStyles } from '@/lib/utils/button-styles'

interface VButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  target?: string
  loading?: boolean
  block?: boolean
  color?: 'primary' | 'gray' | 'black' | 'white' | string
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | string
  size?: 'xs' | 'sm' | 'md' | 'default' | 'lg' | 'xl'
  children: React.ReactNode
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

  // Use custom color classes if color prop is provided, otherwise use shadcn variants definition
  // We prioritize our new styling logic
  const { className: customClasses, style: customStyle } = getButtonStyles(variant || 'solid', color || 'primary');

  const sizeMap = {
    xs: 'h-7 px-2 text-xs',
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 py-2',
    default: 'h-9 px-4 py-2',
    lg: 'h-10 px-8',
    xl: 'h-12 px-10 text-lg',
  } as const

  const mappedSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.default

  const buttonClasses = cn(
    customClasses,
    mappedSize,
    block && 'w-full',
    loading && 'opacity-70 pointer-events-none',
    className
  )

  const combinedStyle = { ...customStyle, ...rest.style }

  if (href) {
    return (
      <Link
        href={href as any}
        target={target}
        className={buttonClasses}
        style={combinedStyle}
        onClick={onClick as any}
      >
        {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </Link>
    )
  }

  return (
    <button
      className={buttonClasses}
      style={combinedStyle}
      disabled={disabled || loading}
      type={type as any}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

export default VButton

