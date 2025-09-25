import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Icon
          icon="lucide:loader-2"
          className={`animate-spin ${children ? 'mr-2' : ''}`}
          width={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <Icon
          icon={icon}
          className={children ? 'mr-2' : ''}
          width={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <Icon
          icon={icon}
          className={children ? 'ml-2' : ''}
          width={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      )}
    </motion.button>
  );
};

export default Button;
