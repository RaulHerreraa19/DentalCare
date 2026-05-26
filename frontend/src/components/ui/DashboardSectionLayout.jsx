import React from 'react';
import { cn } from './cn';
import SectionHeader from './SectionHeader';

export default function DashboardSectionLayout({
  title,
  description,
  actions,
  eyebrow,
  children,
  className,
  contentClassName,
  containerClassName,
}) {
  return (
    <section className={cn('space-y-section', containerClassName)}>
      <SectionHeader title={title} description={description} actions={actions} eyebrow={eyebrow} className={className} />
      <div className={cn('space-y-section', contentClassName)}>{children}</div>
    </section>
  );
}