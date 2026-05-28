import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Plus, Search } from 'lucide-react';
import api from '../../lib/axios';
import { Button, Card, DataTable, EmptyState, Input, LoadingScreen, SectionHeader } from '../../components/ui';

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = organizations.filter((org) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query)
    );
  });

  const planStyles = {
    ENTERPRISE: 'bg-accent-50 text-accent-600 border-accent-100',
    PREMIUM: 'bg-primary-50 text-primary-600 border-primary-100',
    DEFAULT: 'bg-surface-muted text-muted border-border',
  };

  if (loading) {
    return <LoadingScreen title="Cargando negocios" description="Sincronizando organizaciones" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Superadministración"
        title="Gestión de negocios"
        description="Administra todas las organizaciones y clínicas de la plataforma desde una vista de lectura rápida."
        actions={(
          <Button as={Link} to="/superadmin/organizations/new" size="sm">
            <Plus className="h-4 w-4" />
            Nuevo negocio
          </Button>
        )}
      />

      <Card className="p-4 md:p-6">
        <Input
          label="Buscar negocios"
          placeholder="Buscar por nombre o identificador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<Search className="h-4 w-4" />}
          containerClassName="max-w-xl"
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-label text-muted">Listado consolidado</p>
              <h2 className="text-section-title text-ink">Organizaciones registradas</h2>
              <p className="text-body text-muted">Vista optimizada para revisar plan, actividad y alcance operativo.</p>
            </div>
            <span className="text-caption uppercase tracking-[0.16em] text-muted">
              {filteredOrgs.length} registros
            </span>
          </div>
        </div>

        <DataTable
          isEmpty={filteredOrgs.length === 0}
          emptyState={(
            <EmptyState
              icon={Building2}
              title="No se encontraron negocios"
              description="Ajusta el filtro para localizar una organización por nombre o slug."
            />
          )}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Negocio</th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Slug</th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Plan</th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Sucursales</th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Usuarios</th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Estado</th>
                <th scope="col" className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredOrgs.map((org) => {
                const planTone = planStyles[org.plan] || planStyles.DEFAULT;

                return (
                  <tr key={org.id} className="transition-colors hover:bg-surface-muted/60">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="rounded-panel bg-primary-50 p-2.5 text-primary-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="text-sm font-medium text-ink">{org.name}</div>
                          <div className="text-xs text-muted">Identificador operativo</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-muted">@{org.slug}</td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex items-center rounded-control border px-3 py-1 text-caption ${planTone}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-ink">{org._count?.clinics || 0}</td>
                    <td className="px-6 py-4 align-top text-sm text-ink">{org._count?.users || 0}</td>
                    <td className="px-6 py-4 align-top">
                      <span className="inline-flex items-center gap-2 text-sm text-muted">
                        <span className={`h-2.5 w-2.5 rounded-full ${org.is_active ? 'bg-success-600' : 'bg-danger-600'}`} />
                        {org.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <Button as={Link} to={`/superadmin/organizations/${org.id}`} variant="secondary" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTable>
      </Card>
    </div>
  );
}
