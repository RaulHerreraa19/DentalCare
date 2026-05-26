import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import Button from './Button';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className,
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn('w-full overflow-hidden rounded-panel border border-border bg-surface shadow-modal', sizes[size] || sizes.md, className)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-6 py-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-section-title text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-body text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 px-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar modal</span>
          </Button>
        </div>

        <div className="px-6 py-6">{children}</div>

        {footer ? <div className="border-t border-border bg-surface-muted px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
