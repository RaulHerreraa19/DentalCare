import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import Swal from 'sweetalert2';
import {
  Building,
  Building2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Image as ImageIcon,
  Lock,
  MapPin,
  Phone,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { isValidPhone, normalizePhone } from '../../lib/validators';
import { Button, Card, DataTable, EmptyState, Input, SectionHeader } from '../../components/ui';

export default function OwnerClinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const fetchClinics = async () => {
    try {
      const { data } = await api.get('/clinics/my');
      setClinics(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post('/clinics', { name, address });
      setShowForm(false);
      setName('');
      setAddress('');
      await Swal.fire({
        icon: 'success',
        title: 'Sucursal registrada',
        text: 'La nueva unidad de negocio ha sido dada de alta exitosamente.',
        confirmButtonColor: '#0f172a',
        timer: 1500,
      });
      fetchClinics();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de red',
        text: 'No se pudo completar el registro de la sucursal.',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-layout py-layout">
        <Card className="flex items-center gap-3 px-6 py-5 text-body text-muted">
          <Building2 className="h-5 w-5 animate-pulse text-primary-600" />
          Sincronizando centros...
        </Card>
      </div>
    );
  }

  const activeClinics = clinics.filter((clinic) => clinic.status === 'ACTIVE').length;

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Operación por sucursal"
        title="Gestión de sucursales"
        description="Configuración de identidad visual y distribución operativa."
        actions={(
          <Button onClick={() => setShowForm((current) => !current)} size="sm">
            <Plus className="h-4 w-4" />
            {showForm ? 'Ocultar alta' : 'Registrar nueva sucursal'}
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-label text-muted">Sucursales registradas</p>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-ink">{clinics.length}</div>
          <p className="mt-2 text-body text-muted">Unidades operativas bajo esta organización.</p>
        </Card>
        <Card className="p-6">
          <p className="text-label text-muted">Sucursales activas</p>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-ink">{activeClinics}</div>
          <p className="mt-2 text-body text-muted">Disponibles para operar y expandir consultorios.</p>
        </Card>
      </div>

      {showForm ? (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border bg-surface-muted px-6 py-5">
            <div className="rounded-panel bg-primary-50 p-2 text-primary-600">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-section-title text-ink">Datos de la sucursal</h2>
              <p className="text-body text-muted">Captura los datos mínimos para registrar una nueva unidad de negocio.</p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
              <Input
                required
                label="Nombre comercial"
                placeholder="Ej. Clínica Dental Central"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                required
                label="Dirección física completa"
                placeholder="Calle, número, colonia, ciudad"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-surface-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-caption uppercase tracking-[0.16em] text-muted">
                <Lock className="h-4 w-4" />
                Sujeto a validación administrativa para inicio de operaciones
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Descartar
                </Button>
                <Button type="submit">Crear sucursal</Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="space-y-4">
        {clinics.map((clinic) => (
          <ClinicRow key={clinic.id} clinic={clinic} onUpdate={fetchClinics} />
        ))}

        {clinics.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={Building}
              title="Sin unidades operativas registradas"
              description="Registra la primera sucursal para comenzar a distribuir consultorios y operación clínica."
            />
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function ClinicRow({ clinic, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: clinic.name,
    address: clinic.address,
    phone: clinic.phone || '',
    logo_url: clinic.logo_url || '',
  });
  const [showAddOffice, setShowAddOffice] = useState(false);
  const [officeName, setOfficeName] = useState('');
  const [officeFloor, setOfficeFloor] = useState('');

  const fetchOffices = async () => {
    setLoadingOffices(true);
    try {
      const res = await api.get(`/clinics/${clinic.id}/offices`);
      setOffices(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOffices(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      fetchOffices();
    }
  }, [expanded]);

  const handleUpdate = async () => {
    if (editData.phone && !isValidPhone(editData.phone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: 'El teléfono de atención debe contener entre 8 y 15 dígitos.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    try {
      await api.patch(`/clinics/${clinic.id}`, {
        ...editData,
        phone: editData.phone ? normalizePhone(editData.phone) : '',
      });
      setIsEditing(false);
      await Swal.fire({
        icon: 'success',
        title: 'Configuración actualizada',
        text: 'Los datos de la sucursal han sido sincronizados correctamente.',
        confirmButtonColor: '#0f172a',
        timer: 1500,
      });
      onUpdate();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de actualización',
        text: 'No se pudieron guardar los cambios en la sucursal.',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  const handleAddOffice = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/clinics/${clinic.id}/offices`, { name: officeName, floor: officeFloor });
      setOfficeName('');
      setOfficeFloor('');
      setShowAddOffice(false);
      await Swal.fire({
        icon: 'success',
        title: 'Área registrada',
        text: 'El nuevo consultorio ha sido añadido a la distribución de la sucursal.',
        confirmButtonColor: '#0f172a',
        timer: 1500,
      });
      fetchOffices();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error operativo',
        text: 'No se pudo registrar el consultorio en este momento.',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border bg-surface-muted px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left outline-none"
        >
          <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-panel border border-border bg-surface text-muted shadow-soft">
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt="Logo de la sucursal" className="h-full w-full object-contain p-1" />
            ) : (
              <Building className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-section-title text-ink">{clinic.name}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-muted">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{clinic.address}</span>
              </span>
              <span className={`inline-flex items-center gap-2 rounded-control border px-3 py-1 ${clinic.status === 'ACTIVE' ? 'border-success-100 bg-success-50 text-success-600' : 'border-border bg-surface text-muted'}`}>
                <span className={`h-2 w-2 rounded-full ${clinic.status === 'ACTIVE' ? 'bg-success-600' : 'bg-border'}`} />
                {clinic.status === 'ACTIVE' ? 'Activa' : clinic.status}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((current) => !current)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-6 bg-surface-muted/40 p-6">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <Building2 className="h-4 w-4" />
              Distribución operativa
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowAddOffice((current) => !current)}>
              <Plus className="h-4 w-4" />
              Registrar área
            </Button>
          </div>

          {showAddOffice ? (
            <Card className="p-6">
              <form onSubmit={handleAddOffice} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Input
                    required
                    label="Identificador de área"
                    placeholder="Ej. Unidad 1 / Box A"
                    value={officeName}
                    onChange={(event) => setOfficeName(event.target.value)}
                  />
                  <Input
                    label="Nivel o referencia"
                    placeholder="Ej. Primer piso / Ala norte"
                    value={officeFloor}
                    onChange={(event) => setOfficeFloor(event.target.value)}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                  <Button type="button" variant="secondary" onClick={() => setShowAddOffice(false)}>
                    Ocultar
                  </Button>
                  <Button type="submit">Confirmar</Button>
                </div>
              </form>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <DataTable loading={loadingOffices}>
              {offices.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="Sin consultorios configurados"
                  description="Agrega consultorios para organizar la infraestructura de esta sucursal."
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
                        Nivel o referencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {offices.map((office) => (
                      <tr key={office.id} className="transition-colors hover:bg-surface-muted/60">
                        <td className="px-6 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-ink">{office.name}</p>
                            <p className="text-caption text-muted">Consultorio operativo</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-muted">{office.floor || 'Sin referencia'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </DataTable>
          </Card>
        </div>
      ) : null}

      {isEditing ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md">
          <Card className="w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-muted px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-panel bg-primary-50 p-2 text-primary-600">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-section-title text-ink">Configuración de sucursal</h2>
                  <p className="text-body text-muted">Actualiza identidad, contacto y branding de la unidad.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <Input
                  label="Nombre de la sucursal"
                  value={editData.name}
                  onChange={(event) => setEditData({ ...editData, name: event.target.value })}
                />
                <Input
                  label="Dirección comercial"
                  value={editData.address}
                  onChange={(event) => setEditData({ ...editData, address: event.target.value })}
                />
                <Input
                  label="Teléfono de atención"
                  value={editData.phone}
                  onChange={(event) => setEditData({ ...editData, phone: event.target.value })}
                  prefix={<Phone className="h-4 w-4" />}
                />
                <Input
                  label="Logo de la clínica (URL)"
                  placeholder="https://ejemplo.com/logo.png"
                  value={editData.logo_url}
                  onChange={(event) => setEditData({ ...editData, logo_url: event.target.value })}
                />
                <div className="flex items-center gap-4 rounded-panel border border-border bg-surface-muted p-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-panel border border-border bg-surface text-muted">
                    {editData.logo_url ? (
                      <img src={editData.logo_url} alt="Vista previa del logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>
                  <p className="text-caption text-muted">
                    Este logo aparecerá en el encabezado de las recetas digitales generadas por esta sucursal.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate}>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}
