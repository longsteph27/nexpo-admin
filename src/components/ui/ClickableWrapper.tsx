/**
 * ClickableWrapper - Standardized clickable wrapper component
 * 
 * This component provides a consistent way to make any element clickable
 * using shadcn Button as a wrapper to ensure proper cursor pointer behavior
 * and accessibility across the entire application.
 * 
 * Usage:
 * - Use this for any clickable area that needs consistent behavior
 * - Maintains layout by using Button as a wrapper only
 * - Automatically handles cursor pointer, focus states, and accessibility
 */

'use client';

import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ClickableWrapperProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'ghost' | 'default' | 'destructive' | 'outline' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  title?: string;
  'aria-label'?: string;
}

export function ClickableWrapper({
  children,
  onClick,
  disabled = false,
  className,
  variant = 'ghost',
  size = 'default',
  title,
  'aria-label': ariaLabel,
}: ClickableWrapperProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-auto w-auto p-0', // Reset button defaults
        className
      )}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </Button>
  );
}

export default ClickableWrapper;
