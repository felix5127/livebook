'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'white';
  text?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', variant = 'default', text, ...props }, ref) => {
    const sizes = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8", 
      xl: "w-12 h-12",
    };

    const variants = {
      default: "text-neutral-600",
      brand: "text-brand-600",
      white: "text-white",
    };

    const textSizes = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg",
    };

    return (
      <div
        className={cn("flex flex-col items-center justify-center space-y-2", className)}
        ref={ref}
        {...props}
      >
        <div className={cn("animate-spin", sizes[size], variants[variant])}>
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        {text && (
          <p className={cn("text-center", textSizes[size], variants[variant])}>
            {text}
          </p>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Alternative dot-style loader
export const LoadingDots = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', variant = 'default', text, ...props }, ref) => {
    const dotSizes = {
      sm: "w-1 h-1",
      md: "w-1.5 h-1.5",
      lg: "w-2 h-2",
      xl: "w-3 h-3",
    };

    const variants_dots = {
      default: "bg-neutral-600",
      brand: "bg-brand-600", 
      white: "bg-white",
    };

    const textSizes = {
      sm: "text-xs",
      md: "text-sm", 
      lg: "text-base",
      xl: "text-lg",
    };

    return (
      <div
        className={cn("flex flex-col items-center justify-center space-y-2", className)}
        ref={ref}
        {...props}
      >
        <div className="flex space-x-1">
          <div className={cn("rounded-full animate-bounce", dotSizes[size], variants_dots[variant])} style={{ animationDelay: '0ms' }} />
          <div className={cn("rounded-full animate-bounce", dotSizes[size], variants_dots[variant])} style={{ animationDelay: '150ms' }} />
          <div className={cn("rounded-full animate-bounce", dotSizes[size], variants_dots[variant])} style={{ animationDelay: '300ms' }} />
        </div>
        {text && (
          <p className={cn("text-center", textSizes[size], variant === 'white' ? 'text-white' : variant === 'brand' ? 'text-brand-600' : 'text-neutral-600')}>
            {text}
          </p>
        )}
      </div>
    );
  }
);

LoadingDots.displayName = 'LoadingDots';

export default LoadingSpinner;