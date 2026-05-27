import React from 'react';
import { cn } from './cn';
import EmptyState from './EmptyState';

let hasWarnedMissingIsEmpty = false;

export default function DataTable({
  children,
  loading = false,
  emptyState,
  isEmpty,
  className,
  containerClassName,
}) {
  if (import.meta.env.DEV && emptyState && isEmpty === undefined && !hasWarnedMissingIsEmpty) {
    console.warn('DataTable: emptyState was provided without isEmpty. Pass isEmpty explicitly to avoid ambiguous empty-state rendering.');
    hasWarnedMissingIsEmpty = true;
  }

  return (
    <div className={cn('rounded-panel border border-border bg-surface shadow-card overflow-hidden', containerClassName)}>
      <div className={cn('overflow-x-auto', className)}>
        {loading ? (
          <div className="px-6 py-12 text-center text-muted text-sm" role="status" aria-live="polite">Cargando...</div>
        ) : emptyState && isEmpty ? (
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
