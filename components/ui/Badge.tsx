'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'warm' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center font-medium rounded-full transition-colors duration-200";
    
    const variants = {
      default: "bg-neutral-100 text-neutral-800",
      success: "bg-success-100 text-success-800",
      warning: "bg-warning-100 text-warning-800", 
      error: "bg-error-100 text-error-800",
      info: "bg-blue-100 text-blue-800",
      warm: "bg-brand-100 text-brand-800",
      outline: "border border-neutral-300 text-neutral-700 bg-white",
    };
    
    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base",
    };

    const dotSizes = {
      sm: "w-1.5 h-1.5",
      md: "w-2 h-2", 
      lg: "w-2.5 h-2.5",
    };

    const dotVariants = {
      default: "bg-neutral-500",
      success: "bg-success-500",
      warning: "bg-warning-500",
      error: "bg-error-500", 
      info: "bg-blue-500",
      warm: "bg-brand-500",
      outline: "bg-neutral-500",
    };

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {dot && (
          <div
            className={cn(
              "rounded-full mr-1.5",
              dotSizes[size],
              dotVariants[variant]
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;