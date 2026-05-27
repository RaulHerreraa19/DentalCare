import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  LayoutDashboard,
  Settings,
  Shield,
  Stethoscope,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  KPIStatCard,
  SectionHeader,
} from '../../components/ui';

function formatDate(value) {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('es-MX');
}

export default function OrganizationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/organizations/${id}`);
      setOrg(res.data.data);
    } catch (error) {
      console.error('Error fetching org details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-layout py-layout">
        <Card className="flex items-center gap-3 px-6 py-5 text-body text-muted">
          <LayoutDashboard className="h-5 w-5 animate-pulse text-primary-600" />
          Cargando detalles del negocio...
        </Card>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-3xl px-layout py-layout">
        <EmptyState
          icon={XCircle}
          title="Negocio no encontrado"
          description="No fue posible cargar la organización solicitada. Verifica que el identificador sea correcto."
          action={(
            <Button as={Link} to="/superadmin/organizations" variant="secondary">
              Volver a negocios
            </Button>
          )}
        />
      </div>
    );
  }

  const clinicCount = org._count?.clinics || 0;
  const userCount = org._count?.users || 0;
  const patientCount = org._count?.patients || 0;
  const isActive = Boolean(org.is_active);
  const statusLabel = isActive ? 'Activo' : 'Suspendido';
  const hasClinics = (org.clinics?.length || 0) > 0;
  const hasUsers = (org.users?.length || 0) > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Superadministración"
        title={org.name}
        description={`Identificador único: @${org.slug} · Registrado el ${formatDate(org.created_at)}`}
        actions={(
          <div className="flex flex-wrap items-center gap-3">
            <Button as={Link} to="/superadmin/organizations" variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Volver a negocios
            </Button>
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
            <Button size="sm">
              <Shield className="h-4 w-4" />
              Cambiar plan
            </Button>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPIStatCard
          title="Plan actual"
          value={org.plan}
          icon={LayoutDashboard}
          tone="primary"
          footer="Suscripción vigente"
        />
        <KPIStatCard
          title="Sucursales"
          value={clinicCount}
          icon={Building2}
          tone="accent"
          footer="Clínicas registradas"
        />
        <KPIStatCard
          title="Personal total"
          value={userCount}
          icon={Users}
          tone="success"
          footer="Usuarios asignados"
        />
        <KPIStatCard
          title="Pacientes"
          value={patientCount}
          icon={UserCheck}
          tone="danger"
          footer="Pacientes vinculados"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-section">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1">
                <p className="text-label text-muted">Resumen general</p>
                <h2 className="text-section-title text-ink">Estado operativo</h2>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-control border px-3 py-1 text-caption ${isActive ? 'border-success-100 bg-success-50 text-success-600' : 'border-danger-100 bg-danger-50 text-danger-600'}`}>
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'}`} />
                {statusLabel}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">Plan actual</span>
                <span className="font-medium text-ink">{org.plan}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">Fecha de registro</span>
                <span className="font-medium text-ink">{formatDate(org.created_at)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">Sucursales</span>
                <span className="font-medium text-ink">{clinicCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">Personal total</span>
                <span className="font-medium text-ink">{userCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">Pacientes</span>
                <span className="font-medium text-ink">{patientCount}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-panel bg-primary-50 p-2 text-primary-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-label text-muted">Salud del negocio</p>
                <h3 className="text-section-title text-ink">Suscripción OK</h3>
                <p className="text-body text-muted">
                  Este cliente ha mantenido su suscripción activa durante el último año sin incidentes.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-section">
          <Card className="overflow-hidden">
            <div className="border-b border-border bg-surface-muted px-6 py-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                <Building2 className="h-4 w-4" />
                Sucursales y clínicas
              </div>
              <p className="mt-1 text-body text-muted">Información consolidada por ubicación operativa.</p>
            </div>

            <DataTable>
              {hasClinics ? (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Sucursal</th>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Dirección</th>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Consultorios</th>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Citas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {org.clinics?.map((clinic) => (
                      <tr key={clinic.id} className="transition-colors hover:bg-surface-muted/60">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="rounded-panel bg-primary-50 p-2 text-primary-600">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-ink">{clinic.name}</div>
                              <div className="text-xs text-muted">Ubicación clínica</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-muted">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-none text-muted" />
                            <span>{clinic.address || 'Sin dirección'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-ink">{clinic._count?.offices || 0}</td>
                        <td className="px-6 py-4 align-top text-sm text-ink">{clinic._count?.appointments || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No hay sucursales registradas"
                  description="Cuando la organización tenga clínicas activas, aparecerán aquí con su dirección y métricas base."
                  className="m-6"
                />
              )}
            </DataTable>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border bg-surface-muted px-6 py-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                <Users className="h-4 w-4" />
                Equipo de trabajo
              </div>
              <p className="mt-1 text-body text-muted">Roles, estado y contacto del personal asignado.</p>
            </div>

            <DataTable>
              {hasUsers ? (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Nombre</th>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Rol</th>
                      <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Estado</th>
                      <th scope="col" className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">Contacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {org.users?.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-surface-muted/60">
                        <td className="px-6 py-4 align-top font-medium text-ink">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            {user.role === 'DOCTOR' ? (
                              <Stethoscope className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex items-center rounded-control border px-3 py-1 text-caption ${user.is_active ? 'border-success-100 bg-success-50 text-success-600' : 'border-danger-100 bg-danger-50 text-danger-600'}`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-right text-sm text-muted">
                          {user.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No hay usuarios asignados"
                  description="Cuando se agregue personal a la organización, el equipo aparecerá aquí con su rol y estado."
                  className="m-6"
                />
              )}
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
}
