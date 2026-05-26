import React, { forwardRef } from 'react';
import { cn } from './cn';

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft',
  secondary:
    'bg-surface text-ink border border-border hover:bg-surface-muted focus:ring-primary-500 shadow-soft',
  ghost:
    'bg-transparent text-muted hover:bg-surface-muted hover:text-ink focus:ring-primary-500',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-soft',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    className,
    type,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const isButton = Component === 'button';

  return (
    <Component
      ref={ref}
      type={isButton ? type || 'button' : type}
      disabled={isButton ? disabled : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Button;
