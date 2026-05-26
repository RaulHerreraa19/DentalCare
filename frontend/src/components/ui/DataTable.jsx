import React from 'react';
import { cn } from './cn';
import EmptyState from './EmptyState';

export default function DataTable({
  children,
  loading = false,
  emptyState,
  className,
  containerClassName,
}) {
  return (
    <div className={cn('rounded-panel border border-border bg-surface shadow-card overflow-hidden', containerClassName)}>
      <div className={cn('overflow-x-auto', className)}>
        {loading ? (
          <div className="px-6 py-12 text-center text-muted text-sm">Cargando...</div>
        ) : emptyState ? (
          emptyState
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function DataTableEmpty(props) {
  return <EmptyState {...props} className={cn('m-6')} />;
}
