import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ title = 'Cargando...', description = 'Sincronizando datos' }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-layout py-layout">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-caption text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}