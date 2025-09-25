import React, { forwardRef } from 'react';
import { Icon } from '@iconify/react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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
    const inputClasses = `
      w-full px-4 py-3 border rounded-lg transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-50 disabled:cursor-not-allowed
      ${leftIcon ? 'pl-12' : ''}
      ${rightIcon ? 'pr-12' : ''}
      ${error 
        ? 'border-red-500 focus:ring-red-500' 
        : success 
        ? 'border-green-500 focus:ring-green-500' 
        : 'border-gray-300 hover:border-gray-400'
      }
      ${className}
    `.trim();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon 
                icon={leftIcon} 
                className={`w-5 h-5 ${error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'}`}
              />
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Icon 
                icon={rightIcon} 
                className={`w-5 h-5 ${
                  onRightIconClick 
                    ? 'cursor-pointer hover:text-gray-600' 
                    : 'pointer-events-none'
                } ${error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'}`}
                onClick={onRightIconClick}
              />
            </div>
          )}
        </div>
        
        {(error || success || helperText) && (
          <div className="mt-2 flex items-center">
            {error && (
              <>
                <Icon icon="lucide:alert-circle" className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">{error}</span>
              </>
            )}
            
            {success && !error && (
              <>
                <Icon icon="lucide:check-circle" className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{success}</span>
              </>
            )}
            
            {helperText && !error && !success && (
              <span className="text-sm text-gray-500">{helperText}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
