'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'warm' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const baseStyles = "rounded-2xl transition-all duration-200";
    
    const variants = {
      default: "bg-white shadow-soft",
      elevated: "bg-white shadow-lg shadow-neutral-200/50",
      bordered: "bg-white border border-neutral-200 shadow-soft",
      warm: "bg-gradient-warm shadow-warm border border-brand-200/50",
      glass: "bg-white/80 backdrop-blur-sm border border-white/20 shadow-soft",
    };
    
    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8", 
      xl: "p-10",
    };

    const hoverStyles = hover ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer" : "";

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight text-neutral-900", className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-neutral-600 leading-relaxed", className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-6", className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;