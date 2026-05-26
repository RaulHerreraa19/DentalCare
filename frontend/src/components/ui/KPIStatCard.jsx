import React from 'react';
import { cn } from './cn';
import Card from './Card';

const toneStyles = {
  primary: {
    badge: 'bg-primary-50 text-primary-600 border-primary-100',
    accent: 'bg-primary-600',
  },
  success: {
    badge: 'bg-success-50 text-success-600 border-success-100',
    accent: 'bg-success-600',
  },
  danger: {
    badge: 'bg-danger-50 text-danger-600 border-danger-100',
    accent: 'bg-danger-600',
  },
  accent: {
    badge: 'bg-accent-50 text-accent-600 border-accent-100',
    accent: 'bg-accent-500',
  },
};

export default function KPIStatCard({
  title,
  value,
  badge,
  footer,
  icon: Icon,
  tone = 'primary',
  className,
  valueClassName,
  footerClassName,
}) {
  const toneClass = toneStyles[tone] || toneStyles.primary;

  return (
    <Card className={cn('p-6 h-full flex flex-col gap-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-label text-muted">{title}</p>
          <div className={cn('text-3xl md:text-4xl font-semibold tracking-tight text-ink', valueClassName)}>{value}</div>
        </div>

        {badge ? (
          <span className={cn('inline-flex items-center gap-1.5 rounded-control border px-3 py-1 text-caption', toneClass.badge)}>
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {badge}
          </span>
        ) : null}
      </div>

      {footer ? (
        <div className={cn('flex items-center gap-2 border-t border-border pt-4 text-caption uppercase tracking-[0.16em] text-muted', footerClassName)}>
          <span className={cn('h-2 w-2 rounded-full', toneClass.accent)} />
          {footer}
        </div>
      ) : null}
    </Card>
  );
}