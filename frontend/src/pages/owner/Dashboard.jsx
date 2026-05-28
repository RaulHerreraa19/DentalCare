import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Building,
  Calendar,
  Download,
  FileBarChart2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserCircle2,
  Users,
} from 'lucide-react';
import api from '../../lib/axios';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  KPIStatCard,
  Input,
  SectionHeader,
  SelectControl,
  LoadingScreen,
} from '../../components/ui';

const periodOptions = [
  { value: 'today', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'custom', label: 'Rango' },
];

function formatMoney(value) {
  return (value || 0).toLocaleString('es-MX');
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
    period: 'month',
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
        api.get('/clinics'),
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
      endDate: end.toISOString().split('T')[0],
    }));
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const response = await api.get('/dashboard/export', {
        params: filters,
        responseType: 'blob',
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
    return <LoadingScreen title="Cargando tablero corporativo" description="Sincronizando métricas y sucursales" />;
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
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.9fr_1fr] xl:items-end">
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

          <SelectControl
            label="Sucursal"
            value={filters.clinic_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, clinic_id: e.target.value }))}
            prefix={<Building className="h-4 w-4" />}
          >
            <option value="">Todas las sucursales</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </SelectControl>
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
        <KPIStatCard
          title="Ingresos de Caja"
          value={`$${formatMoney(stats?.financial?.total_income)}`}
          tone="success"
          badge="Confirmado"
          icon={TrendingUp}
          footer="Control de periodos"
        />

        <KPIStatCard
          title="Egresos Operativos"
          value={`$${formatMoney(stats?.financial?.total_expense)}`}
          tone="danger"
          badge="Egresado"
          icon={TrendingDown}
          footer="Actualización real"
        />

        <KPIStatCard
          title="Margen Neto"
          value={`$${formatMoney(stats?.financial?.net_balance)}`}
          tone="primary"
          badge="Rentabilidad"
          icon={ArrowUpRight}
          footer="Rentabilidad Corporativa"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-1">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <BarChart3 className="h-4 w-4" />
              Actividad de consultas
            </div>
            <span className="text-caption uppercase tracking-[0.16em] text-muted">Métricas de servicio</span>
          </div>

          <div className="mt-6 space-y-6">
            {[
              { label: 'Citas finalizadas', value: stats?.appointments?.completed, tone: 'primary' },
              { label: 'Citas programadas', value: stats?.appointments?.pending, tone: 'accent' },
              { label: 'Cancelaciones / ausencias', value: stats?.appointments?.cancelled, tone: 'danger' },
            ].map((item) => {
              const totalAppointments = stats?.appointments?.total || 1;
              const width = Math.min(100, ((item.value || 0) / totalAppointments) * 100);
              const barClass = item.tone === 'danger' ? 'bg-danger-600' : item.tone === 'accent' ? 'bg-accent-500' : 'bg-primary-600';

              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <span className="text-label text-muted">{item.label}</span>
                    <span className="text-2xl font-semibold tracking-tight text-ink">{item.value || 0}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
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
              Activos organizacionales
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
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-muted px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                  <Building className="h-4 w-4" />
                  Ingresos por consultorio
                </div>
                <p className="text-body text-muted">Comparación de ingresos por consultorio dentro del rango seleccionado.</p>
              </div>
              <span className="text-caption uppercase tracking-[0.16em] text-muted">{reportByOffice.length ? `${reportByOffice.length} registros` : 'Sin datos'}</span>
            </div>
          </div>

          <DataTable>
            {reportByOffice.length === 0 ? (
              <EmptyState
                icon={Building}
                title="Sin ingresos en este periodo"
                description="Selecciona otro rango de fechas o una sucursal distinta para revisar el desempeño."
                className="m-6"
              />
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                      Consultorio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                      Sucursal
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {reportByOffice.slice(0, 6).map((item) => (
                    <tr key={`${item.office_id}-${item.clinic_name}`} className="transition-colors hover:bg-surface-muted/60">
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-2">
                          <p className="font-medium text-ink">{item.office_name}</p>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                            <div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.max(6, (item.total_income / officeMax) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-muted">{item.clinic_name}</td>
                      <td className="px-6 py-4 align-top text-right text-sm font-semibold text-ink">${formatMoney(item.total_income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataTable>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-muted px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                  <UserCircle2 className="h-4 w-4" />
                  Quién cobró
                </div>
                <p className="text-body text-muted">Desglose de cobros por recepcionista durante el periodo activo.</p>
              </div>
              <span className="text-caption uppercase tracking-[0.16em] text-muted">{reportByCashier.length ? `${reportByCashier.length} registros` : 'Sin datos'}</span>
            </div>
          </div>

          <DataTable>
            {reportByCashier.length === 0 ? (
              <EmptyState
                icon={UserCircle2}
                title="Sin cobros en este periodo"
                description="Ajusta el periodo o la sucursal para consultar la actividad de recepción."
                className="m-6"
              />
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                      Cobros
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {reportByCashier.slice(0, 6).map((item) => (
                    <tr key={item.user_id} className="transition-colors hover:bg-surface-muted/60">
                      <td className="px-6 py-4 align-top font-medium text-ink">{item.cashier_name}</td>
                      <td className="px-6 py-4 align-top text-sm text-muted">{item.role === 'RECEPTIONIST' ? 'Recepcionista' : item.role}</td>
                      <td className="px-6 py-4 align-top text-sm text-muted">{item.transactions_count}</td>
                      <td className="px-6 py-4 align-top text-right text-sm font-semibold text-ink">${formatMoney(item.total_income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataTable>
        </Card>
      </div>
    </div>
  );
}
