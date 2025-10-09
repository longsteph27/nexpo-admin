import React from 'react';
import { Input as BaseInput } from './input-base';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

// Enhanced Input Props
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  containerClassName?: string;
}

// Enhanced Input Component
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    success, 
    helperText, 
    leftIcon, 
    rightIcon, 
    onRightIconClick,
    containerClassName,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = !!success;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon 
                icon={leftIcon} 
                className="w-5 h-5 text-gray-400" 
              />
            </div>
          )}
          
          <BaseInput
            ref={ref}
            id={inputId}
            className={cn(
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError && 'border-red-500 focus-visible:ring-red-500',
              hasSuccess && 'border-green-500 focus-visible:ring-green-500',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div 
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                onRightIconClick && "cursor-pointer"
              )}
              onClick={onRightIconClick}
            >
              <Icon 
                icon={rightIcon} 
                className={cn(
                  "w-5 h-5",
                  hasError && "text-red-500",
                  hasSuccess && "text-green-500",
                  !hasError && !hasSuccess && "text-gray-400"
                )} 
              />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <Icon icon="lucide:alert-circle" className="w-4 h-4" />
            {error}
          </p>
        )}

        {success && !error && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <Icon icon="lucide:check-circle" className="w-4 h-4" />
            {success}
          </p>
        )}

        {helperText && !error && !success && (
          <p className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
