import React, { forwardRef } from 'react';
import { cn } from './cn';

const baseInputClass =
  'w-full rounded-control border border-border bg-surface px-4 py-2.5 text-sm text-ink shadow-soft outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted';

const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    prefix,
    suffix,
    multiline = false,
    rows = 4,
    className,
    labelClassName,
    containerClassName,
    id,
    required,
    ...props
  },
  ref,
) {
  const inputId = id || props.name;
  const descriptionId = helperText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const control = multiline ? (
    <textarea
      ref={ref}
      id={inputId}
      rows={rows}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      required={required}
      className={cn(baseInputClass, 'min-h-24 resize-y', className)}
      {...props}
    />
  ) : (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      required={required}
      className={cn(baseInputClass, className)}
      {...props}
    />
  );

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className={cn('block text-sm font-medium text-muted', labelClassName)}>
          {label}
          {required ? <span className="ml-1 text-danger-600">*</span> : null}
        </label>
      ) : null}

      {prefix || suffix ? (
        <div className="relative">
          {prefix ? <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{prefix}</div> : null}
          {multiline ? (
            <textarea
              ref={ref}
              id={inputId}
              rows={rows}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              required={required}
              className={cn(baseInputClass, prefix ? 'pl-10' : '', suffix ? 'pr-10' : '', multiline ? 'min-h-24 resize-y' : '', className)}
              {...props}
            />
          ) : (
            <input
              ref={ref}
              id={inputId}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              required={required}
              className={cn(baseInputClass, prefix ? 'pl-10' : '', suffix ? 'pr-10' : '', className)}
              {...props}
            />
          )}
          {suffix ? <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">{suffix}</div> : null}
        </div>
      ) : (
        control
      )}

      {helperText ? (
        <p id={descriptionId} className="text-xs text-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
