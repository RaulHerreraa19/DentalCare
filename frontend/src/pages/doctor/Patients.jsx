import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  FileText,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCircle2,
  Users,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../lib/axios';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone, isValidCurp, normalizeCurp } from '../../lib/validators';
import {
  Button,
  Card,
  DataTable,
  DashboardSectionLayout,
  EmptyState,
  Input,
  KPIStatCard,
  LoadingScreen,
  Modal,
  SelectControl,
} from '../../components/ui';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const genderOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
];

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    curp: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact: '',
    notes: '',
  });

  const resetModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
      address: '',
      emergency_contact: '',
      notes: '',
    });
  };

  const openCreateModal = () => {
    setEditingPatient(null);
    setShowModal(true);
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      curp: patient.curp || '',
      phone: patient.phone || '',
      email: patient.email || '',
      date_of_birth: patient.date_of_birth ? String(patient.date_of_birth).slice(0, 10) : '',
      gender: patient.gender || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      notes: patient.notes || '',
    });
    setShowModal(true);
  };

  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/patients/doctor');
        if (!mounted) return;
        setPatients(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Error loading doctor patients:', error);
        if (mounted) setPatients([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPatients();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      const phone = `${patient.phone || ''}`.toLowerCase();
      const email = `${patient.email || ''}`.toLowerCase();
      return fullName.includes(query) || phone.includes(query) || email.includes(query);
    });
  }, [patients, searchTerm]);

  const stats = useMemo(() => ({
    total: patients.length,
    withRecords: patients.filter((patient) => patient.has_record).length,
    activeRecords: patients.filter((patient) => patient.record_status === 'ACTIVE').length,
    recentVisits: patients.filter((patient) => patient.last_appointment_at).length,
  }), [patients]);

  const handleSavePatient = async (event) => {
    event.preventDefault();

    const safeEmail = formData.email ? normalizeEmail(formData.email) : '';
    if (safeEmail && !isValidEmail(safeEmail)) {
      Swal.fire({ icon: 'warning', title: 'Correo inválido', text: 'Ingresa un correo electrónico válido.', confirmButtonColor: '#0f172a' });
      return;
    }

    if (!isValidPhone(formData.phone)) {
      Swal.fire({ icon: 'warning', title: 'Teléfono inválido', text: 'El teléfono debe contener entre 8 y 15 dígitos.', confirmButtonColor: '#0f172a' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        email: safeEmail,
        phone: normalizePhone(formData.phone),
      };

      if (payload.curp && payload.curp.trim() !== '') {
        if (!isValidCurp(payload.curp)) {
          Swal.fire({ icon: 'warning', title: 'CURP inválida', text: 'El CURP debe contener 18 caracteres alfanuméricos en mayúsculas.', confirmButtonColor: '#0f172a' });
          setSaving(false);
          return;
        }
        payload.curp = normalizeCurp(payload.curp);
      }

      if (editingPatient) {
        await api.put(`/patients/${editingPatient.id}`, payload);
        await Swal.fire({ icon: 'success', title: 'Paciente actualizado', text: 'Los datos básicos fueron guardados correctamente.', confirmButtonColor: '#0f172a', timer: 2000 });
        const { data } = await api.get('/patients/doctor');
        setPatients(Array.isArray(data.data) ? data.data : []);
        resetModal();
        return;
      } else {
        const createResponse = await api.post('/patients', payload);
        await Swal.fire({ icon: 'success', title: 'Paciente registrado', text: 'El paciente se creó correctamente.', confirmButtonColor: '#0f172a', timer: 2000 });
        const createdPatientId = createResponse.data?.data?.id;
        resetModal();
        if (createdPatientId) {
          navigate(`/doctor/medical-records/${createdPatientId}`);
          return;
        }
      }

      const { data } = await api.get('/patients/doctor');
      setPatients(Array.isArray(data.data) ? data.data : []);
      resetModal();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: editingPatient ? 'No se pudo actualizar' : 'No se pudo registrar',
        text: error.response?.data?.message || 'Inténtalo de nuevo.',
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen title="Cargando pacientes" description="Sincronizando pacientes ligados al doctor" />;
  }

  return (
    <DashboardSectionLayout
      eyebrow="Atención clínica"
      title="Pacientes del doctor"
      description="Pacientes vinculados por expediente o citas, con acceso directo a su historia clínica."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Nuevo paciente
          </Button>
          <Button as={Link} to="/doctor/records" size="sm">
            <FileText className="h-4 w-4" />
            Ver expedientes
          </Button>
        </div>
      )}
      containerClassName="mx-auto max-w-7xl px-layout py-layout space-y-section animate-in fade-in duration-500"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPIStatCard title="Pacientes ligados" value={stats.total} tone="primary" badge="Total" footer="Relacionados al doctor" />
        <KPIStatCard title="Con expediente" value={stats.withRecords} tone="accent" badge="Activo" footer="Tienen ficha clínica" />
        <KPIStatCard title="Expedientes activos" value={stats.activeRecords} tone="success" badge="Open" footer="Listos para seguimiento" />
        <KPIStatCard title="Visitas recientes" value={stats.recentVisits} tone="warning" badge="Citas" footer="Con al menos una cita" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-label text-muted">Directorio clínico</p>
              <h2 className="text-section-title text-ink">Lista de pacientes asignados</h2>
              <p className="text-body text-muted">Consulta quiénes han sido atendidos o registrados dentro de tu práctica.</p>
            </div>
            <div className="w-full lg:w-[24rem]">
              <Input
                label="Buscar paciente"
                placeholder="Nombre, teléfono o correo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        <DataTable
          isEmpty={filteredPatients.length === 0}
          emptyState={(
            <EmptyState
              icon={Users}
              title="No hay pacientes vinculados"
              description="Aún no se han registrado citas o expedientes asociados a tu cuenta."
            />
          )}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Paciente</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Estado clínico</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Última cita</th>
                <th className="px-6 py-3 text-left text-caption uppercase tracking-[0.14em] text-muted">Expediente</th>
                <th className="px-6 py-3 text-right text-caption uppercase tracking-[0.14em] text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-ink">
                        {patient.first_name?.[0] || 'P'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink leading-tight">{patient.first_name} {patient.last_name}</p>
                        <p className="text-caption text-muted">{patient.phone || 'Sin teléfono'} · {patient.email || 'Sin correo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="space-y-2 text-sm">
                      <div className="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                        {patient.has_record ? 'Con expediente' : 'Pendiente'}
                      </div>
                      <p className="text-caption text-muted">{patient.record_status ? `Expediente ${patient.record_status.toLowerCase()}` : 'Se generará al abrir el expediente'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-ink">{formatDate(patient.last_appointment_at)}</p>
                      <p className="text-caption text-muted flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {patient.last_appointment_clinic?.name || 'Sin sucursal'} · {formatTime(patient.last_appointment_at)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-ink">V{patient.record_version || '—'}</p>
                      <p className="text-caption text-muted">{patient.record_updated_at ? `Actualizado ${formatDate(patient.record_updated_at)}` : 'Sin registro clínico'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/doctor/medical-records/${patient.id}`)}
                      >
                        <Stethoscope className="h-4 w-4" />
                        Abrir expediente
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(patient)}
                      >
                        <PencilLine className="h-4 w-4" />
                        Editar datos
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/doctor/records`)}
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

      <Modal
        open={showModal}
        onClose={resetModal}
        title={editingPatient ? 'Editar paciente' : 'Nuevo paciente'}
        description={editingPatient ? 'Ajusta los datos básicos del paciente desde tu panel clínico.' : 'Registra un paciente para vincularlo al seguimiento clínico.'}
        size="xl"
        footer={(
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={resetModal} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="doctor-patient-form" disabled={saving}>
              {saving ? 'Guardando...' : editingPatient ? 'Guardar cambios' : 'Crear paciente'}
            </Button>
          </div>
        )}
      >
        <form id="doctor-patient-form" onSubmit={handleSavePatient} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 space-y-4">
              <div>
                <p className="text-label text-muted">Identidad</p>
                <h3 className="text-base font-semibold text-ink">Datos básicos</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nombres" required value={formData.first_name} onChange={(e) => setFormData((current) => ({ ...current, first_name: e.target.value }))} />
                <Input label="Apellidos" required value={formData.last_name} onChange={(e) => setFormData((current) => ({ ...current, last_name: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Fecha de nacimiento" type="date" required value={formData.date_of_birth} onChange={(e) => setFormData((current) => ({ ...current, date_of_birth: e.target.value }))} />
                <SelectControl label="Género" required value={formData.gender} onChange={(e) => setFormData((current) => ({ ...current, gender: e.target.value }))} options={genderOptions} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="CURP" value={formData.curp} maxLength={18} onChange={(e) => setFormData((current) => ({ ...current, curp: e.target.value.toUpperCase() }))} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 space-y-4">
              <div>
                <p className="text-label text-muted">Contacto</p>
                <h3 className="text-base font-semibold text-ink">Medios de comunicación</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Teléfono" required value={formData.phone} onChange={(e) => setFormData((current) => ({ ...current, phone: e.target.value }))} />
                <Input label="Correo electrónico" type="email" value={formData.email} onChange={(e) => setFormData((current) => ({ ...current, email: e.target.value }))} />
              </div>
              <Input label="Contacto de emergencia" value={formData.emergency_contact} onChange={(e) => setFormData((current) => ({ ...current, emergency_contact: e.target.value }))} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 space-y-4">
            <div>
              <p className="text-label text-muted">Contexto clínico</p>
              <h3 className="text-base font-semibold text-ink">Información adicional</h3>
            </div>
            <Input label="Dirección" multiline rows={3} value={formData.address} onChange={(e) => setFormData((current) => ({ ...current, address: e.target.value }))} />
            <Input label="Notas clínicas" multiline rows={4} value={formData.notes} onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </DashboardSectionLayout>
  );
}