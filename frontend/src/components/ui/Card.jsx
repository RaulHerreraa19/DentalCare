import React from 'react';
import { cn } from './cn';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-panel border border-border bg-surface shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}
