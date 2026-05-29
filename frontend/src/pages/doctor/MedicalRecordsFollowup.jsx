import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  FileText,
  Filter,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import api from '../../lib/axios';
import { Button, Card, DataTable, DashboardSectionLayout, EmptyState, Input, KPIStatCard, LoadingScreen, SelectControl } from '../../components/ui';

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'CLOSED', label: 'Cerrados' },
  { value: 'ARCHIVED', label: 'Archivados' },
];

const statusTone = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-700',
  ACTIVE: 'border-primary-200 bg-primary-50 text-primary-700',
  CLOSED: 'border-success-200 bg-success-50 text-success-700',
  ARCHIVED: 'border-slate-200 bg-slate-100 text-slate-600',
};

const statusMeta = {
  DRAFT: { label: 'Borrador', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  ACTIVE: { label: 'Activo', tone: 'border-primary-200 bg-primary-50 text-primary-700' },
  CLOSED: { label: 'Cerrado', tone: 'border-success-200 bg-success-50 text-success-700' },
  ARCHIVED: { label: 'Archivado', tone: 'border-slate-200 bg-slate-100 text-slate-600' },
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MedicalRecordsFollowup() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let mounted = true;

    const loadRecords = async () => {
      try {
        setLoading(true);
        const response = await api.get('/medical-records');
        if (!mounted) return;
        setRecords(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (error) {
        console.error('Error loading records:', error);
        if (mounted) setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRecords();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const patientName = `${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`.toLowerCase();
      const phone = `${record.patient?.phone || ''}`.toLowerCase();
      const statusMatch = filterStatus === 'all' || record.status === filterStatus;
      const searchMatch = !query || patientName.includes(query) || phone.includes(query);
      return statusMatch && searchMatch;
    });
  }, [records, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: records.length,
    draft: records.filter((record) => record.status === 'DRAFT').length,
    active: records.filter((record) => record.status === 'ACTIVE').length,
    closed: records.filter((record) => record.status === 'CLOSED').length,
  }), [records]);

  if (loading) {
    return <LoadingScreen title="Cargando expedientes" description="Sincronizando historial clínico del doctor" />;
  }

  return (
    <DashboardSectionLayout
      eyebrow="Expediente clínico"
      title="Expedientes médicos"
      description="Consulta expedientes en una vista limpia, con acceso directo al wizard clínico y a la continuidad de la atención."
      actions={(
        <Button onClick={() => navigate('/doctor/patients')} size="sm" variant="secondary">
          <Users className="h-4 w-4" />
          Pacientes
        </Button>
      )}
      containerClassName="mx-auto max-w-7xl px-layout py-layout space-y-section animate-in fade-in duration-500"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPIStatCard title="Expedientes" value={stats.total} tone="primary" badge="Total" footer="Historial clínico" />
        <KPIStatCard title="Borradores" value={stats.draft} tone="warning" badge="Draft" footer="En edición" />
        <KPIStatCard title="Activos" value={stats.active} tone="accent" badge="Open" footer="En seguimiento" />
        <KPIStatCard title="Cerrados" value={stats.closed} tone="success" badge="Final" footer="Firmados o concluidos" />
      </div>

      <Card className="overflow-hidden border-border/80 bg-surface shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-surface-muted via-surface to-surface-muted px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-label text-muted">Gestión clínica</p>
              <h2 className="text-section-title text-ink">Índice de expedientes</h2>
              <p className="text-body text-muted">
                Abre un expediente para continuar con historia, diagnóstico, odontograma y consentimientos en una sola vista.
              </p>
            </div>

            <div className="grid gap-3 w-full xl:max-w-4xl xl:grid-cols-[1.2fr_0.9fr_auto]">
              <Input
                label="Buscar paciente"
                placeholder="Nombre o teléfono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<Search className="h-4 w-4" />}
              />
              <SelectControl
                label="Filtrar estado"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={statusOptions}
                prefix={<Filter className="h-4 w-4" />}
              />
              <div className="flex items-end">
                <Button onClick={() => navigate('/doctor/patients')} size="sm" variant="secondary" className="w-full xl:w-auto">
                  <Users className="h-4 w-4" />
                  Pacientes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="px-6 py-14">
            <EmptyState
              icon={FileText}
              title="No se encontraron expedientes"
              description="Ajusta el filtro o crea una nueva atención para generar un expediente."
            />
          </div>
        ) : (
          <div className="divide-y divide-border bg-surface">
            {filteredRecords.map((record) => {
              const meta = statusMeta[record.status] || statusMeta.DRAFT;

              return (
                <article key={record.id} className="p-5 md:p-6 transition-colors hover:bg-surface-muted/40">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted text-sm font-semibold text-ink shadow-sm">
                        {record.patient?.first_name?.[0] || 'P'}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-ink leading-tight">
                            {record.patient?.first_name} {record.patient?.last_name}
                          </h3>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {record.patient?.phone || 'Sin teléfono'} · {record.patient?.email || 'Sin correo'}
                        </p>
                        <p className="text-sm text-muted line-clamp-2 max-w-4xl">
                          {record.notes?.[0]?.content || record.diagnosis || 'Sin nota reciente'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[34rem]">
                      <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Versión</p>
                        <p className="mt-2 text-sm font-semibold text-ink">v{record.current_version || '1'}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Actualización</p>
                        <p className="mt-2 text-sm font-semibold text-ink">{formatDate(record.updated_at)}</p>
                        <p className="mt-1 flex items-center gap-2 text-caption text-muted">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(record.updated_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Atiende</p>
                        <p className="mt-2 text-sm font-semibold text-ink">
                          {record.doctor?.first_name} {record.doctor?.last_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Expediente clínico
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        Seguimiento en curso
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/doctor/medical-records/${record.patient_id}`)}>
                        <Stethoscope className="h-4 w-4" />
                        Abrir expediente
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/doctor/medical-records/${record.patient_id}`)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </DashboardSectionLayout>
  );
}