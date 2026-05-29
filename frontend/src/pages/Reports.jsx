import React from 'react';
import { BarChart3, FileText, ShieldCheck, Clock3, Users, CalendarDays, ReceiptText } from 'lucide-react';
import { Button, Card, DashboardSectionLayout } from '../components/ui';

const reportGroups = [
  {
    title: 'Médico',
    icon: FileText,
    items: ['Expediente clínico', 'Receta médica', 'Evolución de consulta', 'Consentimientos'],
    note: 'Reportes clínicos y documentos de soporte para la atención.'
  },
  {
    title: 'Recepción',
    icon: CalendarDays,
    items: ['Agenda operativa', 'Registro de pacientes', 'Cobros de cita', 'Movimientos de caja'],
    note: 'Reportes de operación diaria y seguimiento administrativo.'
  },
  {
    title: 'Dirección',
    icon: BarChart3,
    items: ['Ingresos', 'Sucursales', 'Usuarios activos', 'Tendencia operativa'],
    note: 'Indicadores consolidados para supervisión y análisis.'
  },
  {
    title: 'Seguridad y control',
    icon: ShieldCheck,
    items: ['Auditoría', 'Trazabilidad de cambios', 'Firmas y consentimientos', 'Accesos por rol'],
    note: 'Control interno y trazabilidad clínica/administrativa.'
  },
];

const nextSteps = [
  {
    icon: Clock3,
    title: 'Paso 1',
    text: 'Definir qué reportes puede generar cada rol.'
  },
  {
    icon: Users,
    title: 'Paso 2',
    text: 'Determinar filtros, rango de fechas y permisos de acceso.'
  },
  {
    icon: ReceiptText,
    title: 'Paso 3',
    text: 'Implementar la exportación o impresión correspondiente.'
  },
];

export default function Reports() {
  return (
    <DashboardSectionLayout
      eyebrow="Centro de reportes"
      title="Reportes"
      description="Vista central para reunir reportes clínicos, operativos y administrativos según el rol del usuario."
      actions={(
        <Button variant="secondary" size="sm" disabled>
          Próximamente exportación
        </Button>
      )}
      containerClassName="mx-auto max-w-7xl px-layout py-layout space-y-section animate-in fade-in duration-500"
    >
      <Card className="border-border bg-surface p-6 md:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-label text-muted">Estructura inicial</p>
          <h2 className="text-section-title text-ink">Una sola sección de reportes para todos los usuarios</h2>
          <p className="text-body text-muted">
            Aquí iremos agregando, paso a paso, los reportes que cada usuario puede generar y el mecanismo de salida: impresión, PDF o exportación.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.title} className="border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-muted text-ink">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-medium text-ink">{group.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">{group.note}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-surface p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          {nextSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-caption uppercase tracking-[0.18em] text-muted">{step.title}</p>
                    <p className="text-sm text-ink">{step.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </DashboardSectionLayout>
  );
}
