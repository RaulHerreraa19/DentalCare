import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Plus, Settings, Trash2, ListChecks, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';
import { Button, Card, DashboardSectionLayout, DataTable, EmptyState, Input, LoadingScreen } from '../../components/ui';

export default function DoctorServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/services');
      setServices(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', { name, price: parseFloat(price) });
      setName('');
      setPrice('');
      Swal.fire({
        icon: 'success',
        title: 'Servicio Registrado',
        text: 'El nuevo concepto ha sido añadido a tu catálogo profesional.',
        confirmButtonColor: '#0f172a',
        timer: 1500
      });
      fetchServices();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo registrar el servicio en este momento.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: "Esta acción retirará el concepto de tu catálogo profesional.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/services/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El servicio ha sido removido exitosamente.',
          confirmButtonColor: '#0f172a',
          timer: 1500
        });
        fetchServices();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el servicio.',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  if (loading && services.length === 0) return <LoadingScreen title="Cargando catálogo profesional" description="Sincronizando servicios activos" />;

  return (
    <DashboardSectionLayout
      eyebrow="Catálogo clínico"
      title="Servicios profesionales"
      description="Define y administra conceptos de facturación para consultas y procedimientos."
      containerClassName="mx-auto max-w-6xl px-layout py-layout animate-in fade-in duration-500"
    >
      <Card className="p-6 md:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary-600" />
          <p className="text-label text-muted">Registrar nuevo concepto</p>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <Input
            required
            label="Descripción del servicio"
            placeholder="Ej. Diagnóstico clínico general"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            required
            label="Honorario bruto"
            type="number"
            step="0.01"
            placeholder="0.00"
            prefix={<span className="text-muted">$</span>}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Button type="submit" className="w-full md:w-auto">
            Añadir al catálogo
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted" />
            <p className="text-label text-muted">Servicios activos</p>
          </div>
          <span className="text-caption uppercase tracking-[0.14em] text-muted">{services.length} registros</span>
        </div>

        <DataTable
          isEmpty={services.length === 0}
          emptyState={(
            <EmptyState
              icon={Settings}
              title="No hay servicios registrados"
              description="Agrega el primer concepto para comenzar a facturar desde consulta."
            />
          )}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Detalle del servicio</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Honorario</th>
                <th className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {services.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-surface-muted/50">
                  <td className="px-6 py-4 align-top">
                    <p className="text-sm font-semibold text-ink">{service.name}</p>
                    <p className="mt-0.5 text-caption text-muted">ID: {service.id.substring(0, 8).toUpperCase()}</p>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center text-sm font-semibold text-ink">
                      <DollarSign className="mr-1 h-3.5 w-3.5 text-muted" />
                      {parseFloat(service.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      title="Eliminar del catálogo"
                      className="text-danger-600 hover:bg-danger-50 hover:text-danger-900"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
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
