import React from 'react';
import { cn } from './cn';

export default function SectionHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="space-y-1">
        {eyebrow ? <p className="text-label text-muted">{eyebrow}</p> : null}
        <h1 className="text-page-title text-ink">{title}</h1>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
