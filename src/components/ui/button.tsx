import React from 'react';
import { Button as BaseButton, buttonVariants } from './button-base';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

// Enhanced Button Props
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// Enhanced Button Component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'default', 
    size = 'default', 
    loading = false, 
    icon, 
    iconPosition = 'left',
    fullWidth = false,
    children, 
    className,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    // Render icon based on position
    const renderIcon = () => {
      if (!icon) return null;
      
      return (
        <Icon 
          icon={icon} 
          className={cn(
            'shrink-0',
            iconPosition === 'left' ? 'mr-2' : 'ml-2',
            loading && 'animate-spin'
          )} 
        />
      );
    };

    // Render loading spinner
    const renderLoading = () => {
      if (!loading) return null;
      
      return (
        <Icon 
          icon="lucide:loader-2" 
          className="mr-2 h-4 w-4 animate-spin shrink-0" 
        />
      );
    };

    // Render content
    const renderContent = () => {
      if (loading) {
        return (
          <>
            {renderLoading()}
            {children}
          </>
        );
      }

      if (icon) {
        return (
          <>
            {iconPosition === 'left' && renderIcon()}
            {children}
            {iconPosition === 'right' && renderIcon()}
          </>
        );
      }

      return children;
    };

    return (
      <BaseButton
        ref={ref}
        variant={variant}
        size={size}
        disabled={isDisabled}
        className={cn(fullWidth && 'w-full', className)}
        {...props}
      >
        {renderContent()}
      </BaseButton>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;