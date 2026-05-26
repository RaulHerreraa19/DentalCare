import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Building,
  Calendar,
  DollarSign,
  Download,
  FileBarChart2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserCircle2,
  Users,
} from 'lucide-react';
import api from '../../lib/axios';
import { Button, Card, DataTable, Input, SectionHeader } from '../../components/ui';

const periodOptions = [
  { value: 'today', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'custom', label: 'Rango' },
];

const metricToneClasses = {
  primary: {
    badge: 'bg-primary-50 text-primary-600 border-primary-100',
    bar: 'bg-primary-600',
  },
  success: {
    badge: 'bg-success-50 text-success-600 border-success-100',
    bar: 'bg-success-600',
  },
  danger: {
    badge: 'bg-danger-50 text-danger-600 border-danger-100',
    bar: 'bg-danger-600',
  },
  accent: {
    badge: 'bg-accent-50 text-accent-600 border-accent-100',
    bar: 'bg-accent-500',
  },
};

function formatMoney(value) {
  return (value || 0).toLocaleString('es-MX');
}

function DashboardMetricCard({ title, value, tone = 'primary', badge, footer, icon: Icon }) {
  const toneClasses = metricToneClasses[tone] || metricToneClasses.primary;

  return (
    <Card className="p-6 h-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-label text-muted">{title}</p>
          <div className="text-3xl md:text-4xl font-semibold tracking-tight text-ink">${formatMoney(value)}</div>
        </div>

        {badge ? (
          <span className={`inline-flex items-center gap-1.5 rounded-control border px-3 py-1 text-caption ${toneClasses.badge}`}>
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {badge}
          </span>
        ) : null}
      </div>

      {footer ? (
        <div className="flex items-center gap-2 border-t border-border pt-4 text-caption uppercase tracking-[0.16em] text-muted">
          <span className={`h-2 w-2 rounded-full ${toneClasses.bar}`} />
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

function DashboardDataTable({ title, description, icon: Icon, columns, rows, emptyMessage, renderRow }) {
  return (
    <DataTable>
      <div className="border-b border-border bg-surface-muted px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <Icon className="h-4 w-4" />
              {title}
            </div>
            {description ? <p className="text-body text-muted">{description}</p> : null}
          </div>
          <span className="text-caption uppercase tracking-[0.16em] text-muted">{rows.length ? `${rows.length} registros` : 'Sin datos'}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted">{emptyMessage}</div>
      ) : (
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rows.map((row, index) => renderRow(row, index))}
          </tbody>
        </table>
      )}
    </DataTable>
  );
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    clinic_id: '',
    startDate: '',
    endDate: '',
    period: 'month'
  });

  useEffect(() => {
    fetchStats();
  }, [filters]);

  useEffect(() => {
    setRange('month');
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, clinicRes] = await Promise.all([
        api.get('/dashboard/stats', { params: filters }),
        api.get('/clinics')
      ]);
      setStats(statsRes.data.data);
      setClinics(clinicRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const setRange = (rangeType) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (rangeType === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (rangeType === 'week') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (rangeType === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (rangeType === 'custom') {
      setFilters((prev) => ({ ...prev, period: 'custom' }));
      return;
    }
    
    setFilters((prev) => ({
      ...prev,
      period: rangeType,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const response = await api.get('/dashboard/export', {
        params: filters,
        responseType: 'blob'
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `reporte-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error exporting PDF report:', error);
    } finally {
      setExporting(false);
    }
  };

  const reportByOffice = stats?.reports?.income_by_office || [];
  const reportByCashier = stats?.reports?.income_by_receptionist || [];
  const reportTimeline = stats?.reports?.timeline || [];

  const officeMax = Math.max(...reportByOffice.map((item) => item.total_income), 1);
  const cashierMax = Math.max(...reportByCashier.map((item) => item.total_income), 1);
  const timelineMax = Math.max(...reportTimeline.map((item) => item.total_income), 1);

  if (!stats && loading) {
    return (
      <div className="mx-auto max-w-7xl px-layout py-layout">
        <Card className="p-6 text-body text-muted">Sincronizando tablero corporativo...</Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Tablero ejecutivo"
        title="Resumen Ejecutivo"
        description="Análisis de rendimiento financiero y operativo organizacional."
        actions={(
          <>
            <Button variant="secondary" size="sm" onClick={fetchStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </>
        )}
      />

      <Card className="p-4 md:p-6">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <div className="space-y-2">
            <p className="text-label text-muted">Periodo</p>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={filters.period === option.value ? 'primary' : 'secondary'}
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Input
            label="Desde"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, period: 'custom', startDate: e.target.value }))}
            prefix={<Calendar className="h-4 w-4" />}
          />

          <Input
            label="Hasta"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, period: 'custom', endDate: e.target.value }))}
            prefix={<Calendar className="h-4 w-4" />}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted">Sucursal</label>
            <div className="relative">
              <Building className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-4 w-4 text-muted" />
              <select
                className="w-full rounded-control border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-ink shadow-soft outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                value={filters.clinic_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, clinic_id: e.target.value }))}
              >
                <option value="">Todas las sucursales</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-accent-100 bg-accent-50 p-4 md:p-5">
        {stats?.report_branding?.logo_url ? (
          <img
            src={stats.report_branding.logo_url}
            alt="Logo del reporte"
            className="h-10 w-auto max-w-28 rounded border border-accent-100 bg-surface object-contain p-1"
          />
        ) : null}
        <span className="text-caption uppercase tracking-[0.16em] text-ink">Reporte actual</span>
        <span>Organización: {stats?.report_branding?.organization_name || 'N/A'}</span>
        <span>Sucursal branding: {stats?.report_branding?.clinic_name || 'General'}</span>
        <span>
          Rango: {filters.startDate || '---'} a {filters.endDate || '---'}
        </span>
        <span>Ingresos registrados por recepcionistas: ${formatMoney(stats?.reports?.summary?.total_income_receptionists)}</span>
        <span>Movimientos de ingreso: {stats?.reports?.summary?.total_income_transactions || 0}</span>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardMetricCard
          title="Ingresos de Caja"
          value={stats?.financial?.total_income}
          tone="success"
          badge="Confirmado"
          icon={TrendingUp}
          footer="Control de periodos"
        />

        <DashboardMetricCard
          title="Egresos Operativos"
          value={stats?.financial?.total_expense}
          tone="danger"
          badge="Egresado"
          icon={TrendingDown}
          footer="Actualización real"
        />

        <DashboardMetricCard
          title="Margen Neto"
          value={stats?.financial?.net_balance}
          tone="primary"
          badge="Rentabilidad"
          icon={ArrowUpRight}
          footer="Rentabilidad Corporativa"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                <Building className="h-4 w-4" />
                Ingresos por consultorio
              </div>
              <span className="text-caption uppercase tracking-[0.16em] text-muted">Top</span>
            </div>

            <div className="mt-5 space-y-4">
              {reportByOffice.length === 0 ? (
                <p className="text-sm text-muted">Sin ingresos en este periodo.</p>
              ) : (
                reportByOffice.slice(0, 6).map((item) => (
                  <div key={`${item.office_id}-${item.clinic_name}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{item.office_name}</p>
                        <p className="truncate text-caption text-muted">{item.clinic_name}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-ink">${formatMoney(item.total_income)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.max(6, (item.total_income / officeMax) * 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-1">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                <UserCircle2 className="h-4 w-4" />
                Quién cobró
              </div>
              <span className="text-caption uppercase tracking-[0.16em] text-muted">Recepción</span>
            </div>

            <div className="mt-5 space-y-4">
              {reportByCashier.length === 0 ? (
                <p className="text-sm text-muted">Sin cobros en este periodo.</p>
              ) : (
                reportByCashier.slice(0, 6).map((item) => (
                  <div key={item.user_id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{item.cashier_name}</p>
                        <p className="truncate text-caption text-muted">{item.role === 'RECEPTIONIST' ? 'Recepcionista' : item.role}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-ink">${formatMoney(item.total_income)}</span>
                    </div>
                    <div className="flex items-center justify-between text-caption text-muted">
                      <span>{item.transactions_count} cobros</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-success-600" style={{ width: `${Math.max(6, (item.total_income / cashierMax) * 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-1">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                <FileBarChart2 className="h-4 w-4" />
                Tendencia de ingresos
              </div>
              <span className="text-caption uppercase tracking-[0.16em] text-muted">Diario</span>
            </div>

            <div className="mt-6 flex h-44 items-end gap-2">
              {reportTimeline.length === 0 ? (
                <p className="text-sm text-muted">Sin datos en el rango seleccionado.</p>
              ) : (
                reportTimeline.slice(-12).map((item) => (
                  <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                    <div
                      className="w-full max-w-8 rounded-t bg-accent-500"
                      style={{ height: `${Math.max(8, (item.total_income / timelineMax) * 100)}%` }}
                      title={`${item.label}: $${formatMoney(item.total_income)}`}
                    />
                    <span className="mt-2 w-full truncate text-center text-caption text-muted">{item.label.slice(5)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-1">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <BarChart3 className="h-4 w-4" />
              Actividad de Consultas
            </div>
            <span className="text-caption uppercase tracking-[0.16em] text-muted">Métricas de servicio</span>
          </div>

          <div className="mt-6 space-y-6">
            {[
              { label: 'Citas Finalizadas', value: stats?.appointments?.completed, tone: 'primary' },
              { label: 'Citas Programadas', value: stats?.appointments?.pending, tone: 'accent' },
              { label: 'Cancelaciones / Ausencias', value: stats?.appointments?.cancelled, tone: 'danger' },
            ].map((item) => {
              const totalAppointments = stats?.appointments?.total || 1;
              const width = Math.min(100, ((item.value || 0) / totalAppointments) * 100);
              const toneClasses = metricToneClasses[item.tone] || metricToneClasses.primary;

              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <span className="text-label text-muted">{item.label}</span>
                    <span className="text-2xl font-semibold tracking-tight text-ink">{item.value || 0}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div className={`h-full rounded-full ${toneClasses.bar}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
              <span className="text-caption uppercase tracking-[0.16em] text-muted">Volumen total operativo</span>
              <span className="text-3xl font-semibold tracking-tight text-ink">{stats?.appointments?.total || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <Users className="h-4 w-4" />
              Activos Organizacionales
            </div>
            <span className="text-caption uppercase tracking-[0.16em] text-muted">Estructura</span>
          </div>

          <p className="mt-5 max-w-xl text-body text-muted">
            Estructura de personal y sucursales actualmente activas bajo esta administración.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-panel border border-border bg-surface-muted p-5">
              <span className="block text-4xl font-semibold tracking-tight text-ink">{stats?.infrastructure?.branches || 0}</span>
              <span className="mt-2 block text-caption uppercase tracking-[0.16em] text-muted">Sucursales</span>
            </div>
            <div className="rounded-panel border border-border bg-surface-muted p-5">
              <span className="block text-4xl font-semibold tracking-tight text-ink">{stats?.infrastructure?.employees || 0}</span>
              <span className="mt-2 block text-caption uppercase tracking-[0.16em] text-muted">Colaboradores</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardDataTable
          title="Ingresos por consultorio"
          description="Comparación de ingresos por consultorio dentro del rango seleccionado."
          icon={Building}
          rows={reportByOffice.slice(0, 6)}
          emptyMessage="Sin ingresos en este periodo."
          columns={[
            { key: 'office', label: 'Consultorio' },
            { key: 'clinic', label: 'Sucursal' },
            { key: 'income', label: 'Ingresos', className: 'text-right' },
          ]}
          renderRow={(item) => (
            <tr key={`${item.office_id}-${item.clinic_name}`} className="hover:bg-surface-muted/60">
              <td className="px-6 py-4 align-top">
                <div className="space-y-1">
                  <p className="font-medium text-ink">{item.office_name}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.max(6, (item.total_income / officeMax) * 100)}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 align-top text-sm text-muted">{item.clinic_name}</td>
              <td className="px-6 py-4 align-top text-right text-sm font-semibold text-ink">${formatMoney(item.total_income)}</td>
            </tr>
          )}
        />

        <DashboardDataTable
          title="Quién cobró"
          description="Desglose de cobros por recepcionista durante el periodo activo."
          icon={UserCircle2}
          rows={reportByCashier.slice(0, 6)}
          emptyMessage="Sin cobros en este periodo."
          columns={[
            { key: 'cashier', label: 'Usuario' },
            { key: 'role', label: 'Rol' },
            { key: 'transactions', label: 'Cobros' },
            { key: 'income', label: 'Ingresos', className: 'text-right' },
          ]}
          renderRow={(item) => (
            <tr key={item.user_id} className="hover:bg-surface-muted/60">
              <td className="px-6 py-4 align-top">
                <p className="font-medium text-ink">{item.cashier_name}</p>
              </td>
              <td className="px-6 py-4 align-top text-sm text-muted">{item.role === 'RECEPTIONIST' ? 'Recepcionista' : item.role}</td>
              <td className="px-6 py-4 align-top text-sm text-muted">{item.transactions_count}</td>
              <td className="px-6 py-4 align-top text-right text-sm font-semibold text-ink">${formatMoney(item.total_income)}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
