'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'warm' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled,
    icon,
    iconPosition = 'left',
    children,
    ...props 
  }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-soft hover:shadow-warm",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 shadow-soft",
      outline: "border-2 border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400 focus:ring-brand-500",
      ghost: "text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500",
      warm: "bg-gradient-warm text-brand-800 hover:shadow-warm focus:ring-brand-500 shadow-soft",
      danger: "bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-soft",
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      xl: "px-8 py-4 text-xl",
    };

    const iconSizes = {
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4", 
      lg: "w-5 h-5",
      xl: "w-6 h-6",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className={cn("animate-spin", iconSizes[size], children ? "mr-2" : "")} />
            {children && <span className="opacity-70">{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className={cn(iconSizes[size], children ? "mr-2" : "")}>{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className={cn(iconSizes[size], children ? "ml-2" : "")}>{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;