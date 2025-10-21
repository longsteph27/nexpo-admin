import { cn } from '@/lib/utils';
import React from 'react';


export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className,
  ...props
}, ref) => {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={props.id} className="block text-xs font-semibold text-content-secondary mb-1">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        {...props}  
        className={cn("w-full border-0 border-b-2 rounded-sm border-nexpo-border-secondary focus:border-gray-900 outline-none py-2 text-content-primary bg-transparent placeholder-gray-400 resize-none", className)}
      />

    </div>
  )
})
Textarea.displayName = 'Textarea';