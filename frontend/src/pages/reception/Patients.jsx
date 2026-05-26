import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/axios';
import { FileText, Mail, Phone, Search, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../../lib/validators';
import {
  Button,
  Card,
  DataTable,
  DashboardSectionLayout,
  EmptyState,
  Input,
  KPIStatCard,
  Modal,
  SelectControl,
} from '../../components/ui';

const genderOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
];

function formatPatientDate(value) {
  return new Date(value).toLocaleDateString('es-MX', { dateStyle: 'long' });
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return patients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      return fullName.includes(normalizedSearch) || patient.phone?.includes(searchTerm);
    });
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      setPatients(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const safeEmail = formData.email ? normalizeEmail(formData.email) : '';
    if (safeEmail && !isValidEmail(safeEmail)) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Ingresa un correo electrónico válido para el paciente.',
        confirmButtonColor: '#0f172a'
      });
      return;
    }

    if (!isValidPhone(formData.phone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: 'El teléfono debe contener entre 8 y 15 dígitos.',
        confirmButtonColor: '#0f172a'
      });
      return;
    }

    try {
      await api.post('/patients', {
        ...formData,
        email: safeEmail,
        phone: normalizePhone(formData.phone)
      });

      await Swal.fire({
        icon: 'success',
        title: 'Paciente Registrado',
        text: 'El nuevo paciente ha sido dado de alta correctamente.',
        confirmButtonColor: '#0f172a',
        timer: 2000
      });
      fetchPatients();
      setFormData({ first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: '', address: '' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Registro',
        text: error.response?.data?.message || 'No se pudo completar el registro.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  return (
    <DashboardSectionLayout
      eyebrow="Recepción"
      title="Directorio de Pacientes"
      description="Base de datos centralizada de registros clínicos."
      actions={(
        <Button onClick={() => setShowModal(true)}>
          <UserPlus className="h-5 w-5" />
          Nuevo Registro
        </Button>
      )}
      containerClassName="mx-auto max-w-7xl px-layout py-layout animate-in fade-in duration-500"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <KPIStatCard
          title="Pacientes registrados"
          value={patients.length}
          tone="primary"
          badge="Total"
          footer="Base clínica"
        />
        <KPIStatCard
          title="Resultados visibles"
          value={filteredPatients.length}
          tone="accent"
          badge="Filtrados"
          footer="Búsqueda activa"
        />
      </div>

      <Card className="p-4 md:p-6">
        <Input
          label="Buscar por nombre o teléfono"
          placeholder="Escribe para filtrar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<Search className="h-4 w-4" />}
          containerClassName="max-w-xl"
        />
      </Card>

      <DataTable
        loading={loading}
        emptyState={(
          <EmptyState
            icon={Search}
            title="No se encontraron registros activos"
            description="Intenta ajustar el texto de búsqueda para encontrar otro paciente."
          />
        )}
      >
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Paciente
              </th>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Contacto
              </th>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Última actividad
              </th>
              <th scope="col" className="px-6 py-4 text-right text-caption uppercase tracking-[0.14em] text-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-surface-muted/60 transition-colors">
                <td className="px-6 py-5 align-top">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-ink">
                      {patient.first_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink leading-tight">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-caption text-muted">ID: {patient.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-ink">
                      <Phone className="h-4 w-4 text-muted" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.email ? (
                      <div className="flex items-center gap-2 text-muted">
                        <Mail className="h-4 w-4 text-muted" />
                        <span className="break-all">{patient.email}</span>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-5 align-top text-sm">
                  <p className="text-caption uppercase tracking-[0.14em] text-muted">Registro inicial</p>
                  <p className="mt-1 font-medium text-ink">{formatPatientDate(patient.created_at)}</p>
                </td>
                <td className="px-6 py-5 align-top text-right">
                  {user?.role === 'DOCTOR' ? (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/doctor/medical-records/${patient.id}`)}>
                      <FileText className="h-4 w-4" />
                      Expediente
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled>
                      Solo lectura
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Registro de Paciente"
        description="Da de alta un paciente con validación básica de contacto."
        size="lg"
        footer={(
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Descartar
            </Button>
            <Button type="submit" form="patient-create-form">
              Dar de Alta
            </Button>
          </div>
        )}
      >
        <form id="patient-create-form" onSubmit={handleCreate} className="space-y-section">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nombres"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Apellidos"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Fecha de nacimiento"
              type="date"
              required
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            <SelectControl
              label="Género"
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={genderOptions}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Teléfono (WhatsApp)"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Dirección legal"
            multiline
            rows={4}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </form>
      </Modal>
    </DashboardSectionLayout>
  );
}
