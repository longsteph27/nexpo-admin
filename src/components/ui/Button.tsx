import React from 'react';
import { Button, ButtonProps } from './button-base';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends Omit<ButtonProps, 'children'> {
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
} as const;

const ButtonEnhanced = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    children, 
    loading = false, 
    icon, 
    iconPosition = 'left', 
    fullWidth = false, 
    variant,
    className,
    disabled,
    ...props 
  }, ref) => {
    // Map old variants to new ones
    const mappedVariant = variant ? variantMap[variant as keyof typeof variantMap] || variant : 'default';
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        variant={mappedVariant as any}
        className={cn(
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <Icon icon={icon} width={18} />
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <Icon icon={icon} width={18} />
        )}
      </Button>
    );
  }
);

ButtonEnhanced.displayName = 'ButtonEnhanced';

export default ButtonEnhanced;

