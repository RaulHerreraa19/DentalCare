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
      description="Consulta, filtra y abre el expediente de cada paciente con acceso directo al formulario por secciones."
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

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-label text-muted">Gestión clínica</p>
              <h2 className="text-section-title text-ink">Índice de expedientes</h2>
              <p className="text-body text-muted">Abre un expediente para continuar con historia, diagnóstico, odontograma y consentimientos.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr] lg:min-w-[42rem]">
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
            </div>
          </div>
        </div>

        <DataTable
          isEmpty={filteredRecords.length === 0}
          emptyState={(
            <EmptyState
              icon={FileText}
              title="No se encontraron expedientes"
              description="Ajusta el filtro o crea una nueva atención para generar un expediente."
            />
          )}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Paciente</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Estado</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Versión</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Última actualización</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Resumen</th>
                <th className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-ink">
                        {record.patient?.first_name?.[0] || 'P'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink leading-tight">{record.patient?.first_name} {record.patient?.last_name}</p>
                        <p className="text-caption text-muted">{record.patient?.phone || 'Sin teléfono'} · {record.patient?.email || 'Sin correo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone[record.status] || statusTone.DRAFT}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-ink font-medium">
                    v{record.current_version || '1'}
                  </td>
                  <td className="px-6 py-5 align-top text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-ink">{formatDate(record.updated_at)}</p>
                      <p className="text-caption text-muted flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(record.updated_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-muted max-w-[20rem]">
                    <div className="space-y-1">
                      <p className="text-ink font-medium line-clamp-2">
                        {record.notes?.[0]?.content || record.diagnosis || 'Sin nota reciente'}
                      </p>
                      <p className="text-caption uppercase tracking-[0.14em]">{record.doctor?.first_name} {record.doctor?.last_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/doctor/medical-records/${record.patient_id}`)}
                      >
                        <Stethoscope className="h-4 w-4" />
                        Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/doctor/medical-records/${record.patient_id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </Card>
    </DashboardSectionLayout>
  );
}