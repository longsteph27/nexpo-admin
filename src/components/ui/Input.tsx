import React, { forwardRef } from 'react';
import { Input } from './input-base';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface InputEnhancedProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

const InputEnhanced = forwardRef<HTMLInputElement, InputEnhancedProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
          </Label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon 
                icon={leftIcon} 
                className={cn(
                  "w-5 h-5",
                  error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'
                )}
              />
            </div>
          )}
          
          <Input
            ref={ref}
            className={cn(
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
              success && 'border-green-500 focus-visible:ring-green-500',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Icon 
                icon={rightIcon} 
                className={cn(
                  'w-5 h-5',
                  onRightIconClick 
                    ? 'cursor-pointer hover:text-gray-600' 
                    : 'pointer-events-none',
                  error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'
                )}
                onClick={onRightIconClick}
              />
            </div>
          )}
        </div>
        
        {(error || success || helperText) && (
          <div className="flex items-center text-sm">
            {error && (
              <>
                <Icon icon="lucide:alert-circle" className="w-4 h-4 text-red-500 mr-1.5" />
                <span className="text-red-600">{error}</span>
              </>
            )}
            
            {success && !error && (
              <>
                <Icon icon="lucide:check-circle" className="w-4 h-4 text-green-500 mr-1.5" />
                <span className="text-green-600">{success}</span>
              </>
            )}
            
            {helperText && !error && !success && (
              <span className="text-gray-500">{helperText}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

InputEnhanced.displayName = 'InputEnhanced';

export default InputEnhanced;

