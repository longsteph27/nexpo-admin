'use client'
import { cn } from '@/lib/utils/tw'
import { Link } from '@/lib/navigation'
import React, { MouseEventHandler } from 'react'

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  target?: string
  href?: string
  className?: string
  onClick?: MouseEventHandler<any> | undefined
  color?: 'primary' | 'gray' | 'black' | 'white'
  children: React.ReactNode
}

function getButtonColorClass(color: string, variant: string) {
  if (variant === 'solid') {
    if (color === 'primary' || null) return 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90';
    if (color === 'gray') return 'bg-gray-400 text-white hover:bg-gray-500';
    if (color === 'black') return 'bg-black text-white hover:bg-gray-800';
    if (color === 'white') return 'bg-white text-black hover:bg-gray-100 border border-gray-300';
  }
  if (variant === 'outline') {
    if (color === 'primary') return 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10';
    if (color === 'gray') return 'border-gray-400 text-gray-700 hover:bg-gray-100';
    if (color === 'black') return 'border-black text-black hover:bg-gray-100';
    if (color === 'white') return 'border-white text-white hover:bg-gray-100';
  }
  if (variant === 'link') {
    if (color === 'primary') return 'text-[var(--color-primary)] hover:text-[var(--color-primary)]/80';
    if (color === 'gray') return 'text-gray-700 hover:text-gray-900';
    if (color === 'black') return 'text-black hover:text-gray-800';
    if (color === 'white') return 'text-white hover:text-gray-200';
  }
  // Add more for 'soft', 'ghost' as needed
  return '';
}

function VButton(props: ButtonProps) {
  const {
    type = 'button',
    variant = 'solid',
    size = 'md',
    loading,
    disabled,
    block,
    target,
    href,
    color = 'primary',
    children,
  } = props

  const buttonClasses = cn(
    'btn',
    size ? `btn-${size}` : '',
    // 'font-[var(--font-body)]',
    getButtonColorClass(color, variant),
    props.className
  )

  return (
    <div>
      {href && (
        <Link
          href={href as any}
          target={target}
          className={buttonClasses}
          onClick={props.onClick}
        >
          {children}
        </Link>
      )}
      {!href && (
        <button
          className={buttonClasses}
          disabled={disabled}
          type={type}
          onClick={props.onClick}
        >
          {children}
        </button>
      )}
    </div>
  )
}

export default VButton
