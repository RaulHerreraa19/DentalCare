import React, { forwardRef } from 'react';
import { cn } from './cn';

const baseSelectClass =
  'w-full rounded-control border border-border bg-surface px-4 py-2.5 text-sm text-ink shadow-soft outline-none transition-colors placeholder:text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted';

const SelectControl = forwardRef(function SelectControl(
  {
    label,
    helperText,
    error,
    prefix,
    suffix,
    options,
    children,
    className,
    labelClassName,
    containerClassName,
    id,
    required,
    disabled,
    ...props
  },
  ref,
) {
  const selectId = id || props.name;
  const descriptionId = helperText ? `${selectId}-help` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const selectOptions = Array.isArray(options) ? options : null;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className={cn('block text-sm font-medium text-muted', labelClassName)}>
          {label}
          {required ? <span className="ml-1 text-danger-600">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {prefix ? <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{prefix}</div> : null}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
          disabled={disabled}
          className={cn(baseSelectClass, prefix ? 'pl-10' : '', suffix ? 'pr-10' : '', className)}
          {...props}
        >
          {children || selectOptions
            ? children || selectOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : null}
        </select>
        {suffix ? <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">{suffix}</div> : null}
      </div>

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

export default SelectControl;