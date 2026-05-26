import React from 'react';
import { cn } from './cn';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  const Icon = icon;

  return (
    <div className={cn('flex flex-col items-center justify-center rounded-panel border border-dashed border-border bg-surface-muted px-6 py-12 text-center', className)}>
      {Icon ? (
        <div className="mb-4 rounded-full bg-primary-50 p-3 text-primary-600">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-section-title text-ink">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-body text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
