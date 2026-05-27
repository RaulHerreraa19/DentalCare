import React, { useEffect, useState } from 'react';
import { Check, Edit2, Shield, UserCheck, UserPlus, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../lib/axios';
import { isStrongPassword, isValidEmail, normalizeEmail } from '../../lib/validators';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  KPIStatCard,
  SectionHeader,
  SelectControl,
} from '../../components/ui';

const initialFormData = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'DOCTOR',
  clinic_id: '',
  office_ids: [],
  supervisor_id: '',
  is_active: true,
};

export default function OwnerTeam() {
  const [employees, setEmployees] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, clinicsRes] = await Promise.all([
        api.get('/users/team'),
        api.get('/clinics'),
      ]);
      setEmployees(teamRes.data.data);
      setClinics(clinicsRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!formData.clinic_id) {
      setOffices([]);
      return;
    }

    api
      .get(`/clinics/${formData.clinic_id}/offices`)
      .then((response) => setOffices(response.data.data || []))
      .catch(() => setOffices([]));
  }, [formData.clinic_id]);

  const handleOpenInvite = () => {
    if (showForm && !editingUserId) {
      setShowForm(false);
      return;
    }

    setEditingUserId(null);
    setFormData(initialFormData);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      clinic_id: user.clinic_assignments?.[0]?.clinic_id || '',
      office_ids: user.office_assignments?.map((assignment) => assignment.office_id) || [],
      supervisor_id: user.supervisor_id || '',
      is_active: user.is_active,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleOfficeSelection = (officeId) => {
    setFormData((current) => {
      if (current.role === 'DOCTOR') {
        return { ...current, office_ids: [officeId] };
      }

      if (current.office_ids.includes(officeId)) {
        return { ...current, office_ids: current.office_ids.filter((id) => id !== officeId) };
      }

      return { ...current, office_ids: [...current.office_ids, officeId] };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const safeEmail = normalizeEmail(formData.email);

    if (!isValidEmail(safeEmail)) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Ingresa un correo electrónico con formato válido.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    if (!editingUserId && !isStrongPassword(formData.password)) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña insegura',
        text: 'La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    if (!formData.clinic_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección requerida',
        text: 'Por favor selecciona una sucursal para la asignación.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    if (formData.office_ids.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección requerida',
        text: 'Por favor selecciona al menos un consultorio o área de trabajo.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    try {
      if (editingUserId) {
        await api.patch(`/users/${editingUserId}`, { ...formData, email: safeEmail });
      } else {
        await api.post('/users/invite', {
          ...formData,
          email: safeEmail,
          clinics: [formData.clinic_id],
        });
      }

      setShowForm(false);
      setEditingUserId(null);
      setFormData(initialFormData);

      await Swal.fire({
        icon: 'success',
        title: editingUserId ? 'Información actualizada' : 'Invitación enviada',
        text: editingUserId
          ? 'Los cambios en el perfil del colaborador han sido guardados.'
          : 'Se ha registrado el acceso y enviado las credenciales al correo especificado.',
        confirmButtonColor: '#0f172a',
        timer: 1500,
      });

      fetchData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de gestión',
        text: error.response?.data?.message || 'No se pudo completar la operación en el sistema.',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  const doctorCount = employees.filter((user) => user.role === 'DOCTOR').length;
  const receptionistCount = employees.filter((user) => user.role === 'RECEPTIONIST').length;

  if (loading && employees.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-layout py-layout">
        <Card className="flex items-center gap-3 px-6 py-5 text-body text-muted">
          <UserCheck className="h-5 w-5 animate-pulse text-primary-600" />
          Cargando personal...
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Operación y talento"
        title="Gestión de personal"
        description="Administración de equipo y asignación de consultorios."
        actions={(
          <Button onClick={handleOpenInvite} size="sm">
            <UserPlus className="h-4 w-4" />
            {showForm && !editingUserId ? 'Cancelar' : 'Invitar personal'}
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KPIStatCard
          title="Colaboradores"
          value={employees.length}
          icon={UserCheck}
          tone="primary"
          footer="Personal registrado"
        />
        <KPIStatCard
          title="Médicos"
          value={doctorCount}
          icon={Shield}
          tone="success"
          footer="Rol clínico"
        />
        <KPIStatCard
          title="Recepción"
          value={receptionistCount}
          icon={UserPlus}
          tone="accent"
          footer="Rol operativo"
        />
      </div>

      {showForm ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border bg-surface-muted px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-label text-muted">Formulario de personal</p>
              <h2 className="text-section-title text-ink">
                {editingUserId ? 'Editar información' : 'Nuevo miembro'}
              </h2>
              <p className="text-body text-muted">
                Define identidad, rol y asignación operativa para este colaborador.
              </p>
            </div>

            {editingUserId ? (
              <button
                type="button"
                onClick={() => setFormData((current) => ({ ...current, is_active: !current.is_active }))}
                className="inline-flex items-center gap-3 rounded-panel border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-muted"
              >
                <span className="font-medium">Estado de la cuenta</span>
                <span
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${formData.is_active ? 'bg-success-600' : 'bg-border'}`}
                  aria-hidden="true"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </span>
                <span className="text-caption uppercase tracking-[0.16em] text-muted">
                  {formData.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-label text-muted">Datos personales</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Input
                    required
                    label="Nombre"
                    value={formData.first_name}
                    onChange={(event) => setFormData({ ...formData, first_name: event.target.value })}
                  />
                  <Input
                    required
                    label="Apellido"
                    value={formData.last_name}
                    onChange={(event) => setFormData({ ...formData, last_name: event.target.value })}
                  />
                </div>

                <Input
                  required
                  disabled={Boolean(editingUserId)}
                  type="email"
                  label="Correo electrónico"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  helperText={editingUserId ? 'El correo no puede editarse después de enviar la invitación.' : undefined}
                />

                {!editingUserId ? (
                  <Input
                    required
                    type="password"
                    label="Contraseña temporal"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    helperText="Debe cumplir con la política de seguridad definida por la plataforma."
                  />
                ) : null}
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-label text-muted">Asignación operativa</h3>
                </div>

                <SelectControl
                  label="Rol"
                  disabled={Boolean(editingUserId)}
                  value={formData.role}
                  onChange={(event) => setFormData({ ...formData, role: event.target.value, office_ids: [] })}
                >
                  <option value="DOCTOR">Médico especialista</option>
                  <option value="RECEPTIONIST">Personal de recepción</option>
                </SelectControl>

                <SelectControl
                  required
                  label="Sucursal"
                  value={formData.clinic_id}
                  onChange={(event) => setFormData({ ...formData, clinic_id: event.target.value, office_ids: [] })}
                >
                  <option value="">Seleccione sucursal</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </SelectControl>

                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <label className="text-sm font-medium text-muted">
                      Consultorios {formData.role === 'RECEPTIONIST' ? '(Selección múltiple)' : '(Selección única)'}
                    </label>
                    {formData.clinic_id ? (
                      <span className="text-caption uppercase tracking-[0.16em] text-muted">
                        {offices.length} disponibles
                      </span>
                    ) : null}
                  </div>

                  <div className="rounded-panel border border-border bg-surface p-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {offices.map((office) => {
                        const selected = formData.office_ids.includes(office.id);

                        return (
                          <Button
                            key={office.id}
                            type="button"
                            variant={selected ? 'primary' : 'secondary'}
                            size="sm"
                            className="justify-between"
                            onClick={() => toggleOfficeSelection(office.id)}
                          >
                            <span className="truncate">{office.name}</span>
                            {selected ? <Check className="h-3.5 w-3.5" /> : null}
                          </Button>
                        );
                      })}

                      {offices.length === 0 ? (
                        <div className="col-span-full rounded-panel border border-dashed border-border bg-surface-muted px-4 py-5 text-center text-caption text-muted">
                          {formData.clinic_id ? 'No hay consultorios registrados' : 'Seleccione una sucursal primero'}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {formData.role === 'RECEPTIONIST' ? (
                  <SelectControl
                    label="Supervisor directo"
                    value={formData.supervisor_id}
                    onChange={(event) => setFormData({ ...formData, supervisor_id: event.target.value })}
                  >
                    <option value="">Ninguno / General</option>
                    {employees
                      .filter((user) => user.role === 'DOCTOR' && user.id !== editingUserId)
                      .map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                  </SelectControl>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-surface-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingUserId(null);
                  setFormData(initialFormData);
                }}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit">
                {editingUserId ? <Edit2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {editingUserId ? 'Guardar cambios' : 'Confirmar registro'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-label text-muted">Equipo activo</p>
              <h2 className="text-section-title text-ink">Colaboradores registrados</h2>
              <p className="text-body text-muted">Vista consolidada por rol, asignación y estado de cuenta.</p>
            </div>
            <span className="text-caption uppercase tracking-[0.16em] text-muted">
              {employees.length} registros
            </span>
          </div>
        </div>

        <DataTable
          loading={loading && employees.length > 0}
          isEmpty={employees.length === 0}
          emptyState={(
            <EmptyState
              icon={Shield}
              title="Sin registros de personal"
              description="Invita el primer miembro para comenzar a asignar roles, sucursal y consultorios."
            />
          )}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Colaborador
                </th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Asignación
                </th>
                <th scope="col" className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {employees.map((user) => {
                const assignedClinic = user.clinic_assignments?.[0]?.clinic?.name || 'No asignada';
                const userOffices = user.office_assignments?.map((assignment) => assignment.office?.name).join(', ') || 'Sin consultorio';

                return (
                  <tr key={user.id} className="transition-colors hover:bg-surface-muted/60">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-panel border border-border bg-surface-muted font-medium text-ink">
                          {user.first_name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-caption text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="inline-flex items-center rounded-control border border-border bg-surface-muted px-3 py-1 text-caption text-muted">
                        {user.role === 'DOCTOR' ? 'Médico' : 'Recepción'}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1">
                        <div className="text-sm text-ink">{assignedClinic}</div>
                        <div className="max-w-[260px] truncate text-caption text-muted" title={userOffices}>
                          {userOffices}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex items-center gap-2 rounded-control border px-3 py-1 text-caption ${user.is_active ? 'border-success-100 bg-success-50 text-success-600' : 'border-border bg-surface text-muted'}`}>
                        <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-success-600' : 'bg-border'}`} />
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(user)}>
                        <Edit2 className="h-4 w-4" />
                        Editar
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
