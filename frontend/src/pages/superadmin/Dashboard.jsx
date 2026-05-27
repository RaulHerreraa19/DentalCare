import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AlertCircle, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  KPIStatCard,
  SectionHeader,
} from '../../components/ui';

export default function SuperAdminDashboard() {
  const [data, setData] = useState({ pending_clinics: [], pending_offices: [], organizations: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/superadmin/dashboard');
      setData({
        pending_clinics: [],
        pending_offices: [],
        organizations: [],
        ...res.data.data,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApproveClinic = async (id) => {
    const result = await Swal.fire({
      title: '¿Confirmar activación?',
      text: 'Habilitarás este consultorio para operar en la plataforma. ¿Confirmas que has recibido el pago correspondiente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, activar sucursal',
      cancelButtonText: 'Pendiente',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.patch(`/superadmin/approve-clinic/${id}`);
      Swal.fire({
        icon: 'success',
        title: 'Sucursal activada',
        text: 'El consultorio ahora puede iniciar operaciones.',
        confirmButtonColor: '#0f172a',
        timer: 1500,
      });
      fetchDashboard();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error administrativo',
        text: 'No se pudo activar la sucursal.',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-layout py-layout">
        <Card className="flex items-center gap-3 px-6 py-5 text-body text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          Sincronizando panel global...
        </Card>
      </div>
    );
  }

  const organizationCount = data.organizations.length;
  const pendingClinicCount = data.pending_clinics.length;
  const pendingOfficeCount = data.pending_offices.length;

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Panel global"
        title="Superadministración"
        description="Control central para negocios, sucursales y activaciones."
        actions={(
          <Button as={Link} to="/superadmin/organizations/new" size="sm">
            Nuevo negocio
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KPIStatCard
          title="Negocios activos"
          value={organizationCount}
          icon={Building2}
          tone="primary"
          footer="Organizaciones registradas"
        />
        <KPIStatCard
          title="Consultorios pendientes"
          value={pendingClinicCount}
          icon={AlertCircle}
          tone="danger"
          footer="Esperando activación"
        />
        <KPIStatCard
          title="Consultorios por revisar"
          value={pendingOfficeCount}
          icon={CheckCircle2}
          tone="accent"
          footer="Pendientes de pago"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-label text-muted">Activaciones pendientes</p>
              <h2 className="text-section-title text-ink">Consultorios requiriendo activación</h2>
              <p className="text-body text-muted">Autoriza el acceso después de confirmar su pago.</p>
            </div>
            <span className="text-caption uppercase tracking-[0.16em] text-muted">
              {pendingClinicCount} registros
            </span>
          </div>
        </div>

        <DataTable
          isEmpty={pendingClinicCount === 0}
          emptyState={(
            <EmptyState
              icon={AlertCircle}
              title="No hay sucursales pendientes"
              description="Cuando existan consultorios con pago confirmado, aparecerán aquí para activación."
            />
          )}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Sucursal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Negocio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {data.pending_clinics.map((clinic) => (
                <tr key={clinic.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-ink">{clinic.name}</div>
                      <div className="text-xs text-muted">Revisión operativa requerida</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-muted">
                    {clinic.organization?.name || 'Sin organización'}
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-muted">Pendiente de pago</td>
                  <td className="px-6 py-4 align-top text-right">
                    <Button size="sm" onClick={() => handleApproveClinic(clinic.id)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar pagado y habilitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </Card>
    </div>
  );
}
