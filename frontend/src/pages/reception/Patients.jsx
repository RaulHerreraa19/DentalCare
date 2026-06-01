import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../lib/axios';
import { FileText, Mail, Phone, Search, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone, isValidCurp, normalizeCurp } from '../../lib/validators';
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
import { LoadingScreen } from '../../components/ui';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'search'|'pagination'|'refresh' | null
  const [pendingOp, setPendingOp] = useState(null); // next fetch intent: 'initial'|'search'|'pagination'|'create'|'refresh'

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    curp: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: ''
  });
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    // trigger initial load via central effect
    setPendingOp('initial');
  }, []);

  // Clear tenant-scoped data when user/organization changes to avoid cross-tenant leakage
  useEffect(() => {
    // when user changes (logout/login/different org), reset list and refetch for new tenant
    setPatients([]);
    setTotal(0);
    setTotalPages(1);
    setPage(1);
    setPendingOp('initial');
    setUnauthorized(false);
  }, [user?.organization_id]);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = debouncedSearch.toLowerCase();
    return patients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      return fullName.includes(normalizedSearch) || patient.phone?.includes(debouncedSearch);
    });
  }, [patients, debouncedSearch]);

  const inflightKeyRef = useRef(null);

  const fetchPatients = async ({ resetPage = false, usePage = page, usePageSize = pageSize, op = 'refresh' } = {}) => {
    const q = debouncedSearch || '';
    const targetPage = resetPage ? 1 : usePage;

    const key = JSON.stringify({ q: q || undefined, page: targetPage, pageSize: usePageSize });
    // avoid duplicate identical in-flight requests
    if (inflightKeyRef.current && inflightKeyRef.current === key) return;
    inflightKeyRef.current = key;

    if (op === 'initial') setInitialLoading(true);
    else setActionLoading(op);

    try {
      setErrorMessage('');

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const reqId = ++requestIdRef.current;

      const params = {
        mode: 'paginated',
        q: q || undefined,
        page: targetPage,
        pageSize: usePageSize,
        sortBy: 'created_at',
        sortDir: 'desc',
      };

      const res = await api.get('/patients', { params, signal: controller.signal });
      if (reqId !== requestIdRef.current) return;
      if (!mountedRef.current) return;

      const payload = res.data?.data;
      if (payload && !Array.isArray(payload) && Array.isArray(payload.items)) {
        const computedTotal = typeof payload.total === 'number' ? payload.total : payload.items.length;
        const computedTotalPages = typeof payload.totalPages === 'number' ? payload.totalPages : Math.max(1, Math.ceil(computedTotal / usePageSize));
        if (targetPage > computedTotalPages && computedTotalPages >= 1) {
          setTotal(computedTotal);
          setTotalPages(computedTotalPages);
          setPage(computedTotalPages);
          return;
        }
        setPatients(payload.items);
        setTotal(computedTotal);
        setTotalPages(computedTotalPages);
        setPage(payload.page || targetPage);
      } else if (Array.isArray(payload)) {
        const all = payload;
        const computedTotalPages = Math.max(1, Math.ceil(all.length / usePageSize));
        if (targetPage > computedTotalPages && computedTotalPages >= 1) {
          setTotal(all.length);
          setTotalPages(computedTotalPages);
          setPage(computedTotalPages);
          return;
        }
        const start = (targetPage - 1) * usePageSize;
        const sliced = all.slice(start, start + usePageSize);
        setPatients(sliced);
        setTotal(all.length);
        setTotalPages(computedTotalPages);
        setPage(targetPage);
      } else {
        if (mountedRef.current) {
          setPatients([]);
          setTotal(0);
          setTotalPages(1);
          setPage(1);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      const status = err.response?.status;
      if (mountedRef.current) {
        if (status === 401) {
          setErrorMessage('No autorizado. Por favor inicia sesión.');
          setUnauthorized(true);
        } else if (status === 403) {
          setErrorMessage('No tienes permisos para ver pacientes.');
          setUnauthorized(true);
        } else {
          setErrorMessage(err.response?.data?.message || 'Error al cargar pacientes.');
          setUnauthorized(false);
        }
      }
    } finally {
      if (mountedRef.current) {
        if (op === 'initial') setInitialLoading(false);
        else setActionLoading(null);
      }
      // always clear controllers/keys even if unmounted
      abortControllerRef.current = null;
      inflightKeyRef.current = null;
    }
  };

  const resetPatientModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({ first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: '', address: '' });
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
    });
    setShowModal(true);
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();

    const safeEmail = formData.email ? normalizeEmail(formData.email) : '';
    if (safeEmail && !isValidEmail(safeEmail)) {
      Swal.fire({ icon: 'warning', title: 'Correo inválido', text: 'Ingresa un correo electrónico válido para el paciente.', confirmButtonColor: '#0f172a' });
      return;
    }
    if (!isValidPhone(formData.phone)) {
      Swal.fire({ icon: 'warning', title: 'Teléfono inválido', text: 'El teléfono debe contener entre 8 y 15 dígitos.', confirmButtonColor: '#0f172a' });
      return;
    }

    try {
      // Validate CURP if provided
      if (formData.curp && formData.curp.trim() !== "") {
        if (!isValidCurp(formData.curp)) {
          Swal.fire({ icon: 'warning', title: 'CURP inválida', text: 'El CURP debe contener 18 caracteres alfanuméricos en mayúsculas.', confirmButtonColor: '#0f172a' });
          return;
        }
      }
      if (editingPatient) {
        await api.put(`/patients/${editingPatient.id}`, {
          ...formData,
          email: safeEmail,
          phone: normalizePhone(formData.phone),
        });
        await Swal.fire({ icon: 'success', title: 'Paciente Actualizado', text: 'Los datos básicos del paciente fueron actualizados correctamente.', confirmButtonColor: '#0f172a', timer: 2000 });
      } else {
        await api.post('/patients', { ...formData, email: safeEmail, phone: normalizePhone(formData.phone), curp: formData.curp ? formData.curp.trim().toUpperCase() : undefined });
        await Swal.fire({ icon: 'success', title: 'Paciente Registrado', text: 'El nuevo paciente ha sido dado de alta correctamente.', confirmButtonColor: '#0f172a', timer: 2000 });
      }

      // deterministic reset: clear filters and go to first page; central effect will fetch
      setSearchTerm('');
      setDebouncedSearch('');
      setPendingOp(editingPatient ? 'refresh' : 'create');
      setPage(1);
      resetPatientModal();
    } catch (error) {
      Swal.fire({ icon: 'error', title: editingPatient ? 'Error de actualización' : 'Error de Registro', text: error.response?.data?.message || 'No se pudo completar la operación.', confirmButtonColor: '#0f172a' });
    }
  };

  // debounce search input — mark pendingOp so central effect uses correct op
  useEffect(() => {
    const t = setTimeout(() => {
      setPendingOp('search');
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Centralized fetch trigger — only this effect calls fetchPatients to avoid duplicates
  useEffect(() => {
    const op = pendingOp || (initialLoading ? 'initial' : 'refresh');
    fetchPatients({ resetPage: false, usePage: page, usePageSize: pageSize, op }).catch(() => {});
    // clear pending intent after dispatching
    setPendingOp(null);
  }, [debouncedSearch, page, pageSize, pendingOp]);

  return (
    initialLoading && patients.length === 0 ? <LoadingScreen title="Cargando pacientes" description="Sincronizando directorio clínico" /> : (
    <DashboardSectionLayout
      eyebrow="Recepción"
      title="Directorio de Pacientes"
      description="Base de datos centralizada de registros clínicos."
      actions={(
        <Button onClick={() => setShowModal(true)} disabled={unauthorized} title={unauthorized ? 'No autorizado' : ''}>
          <UserPlus className="h-5 w-5" />
          Nuevo Registro
        </Button>
      )}
      containerClassName="mx-auto max-w-7xl px-layout py-layout animate-in fade-in duration-500"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <KPIStatCard title="Pacientes registrados" value={total} tone="primary" badge="Total" footer="Base clínica" />
        <KPIStatCard title="Resultados visibles" value={patients.length} tone="accent" badge="Filtrados" footer="Búsqueda activa" />
      </div>

      <Card className="p-4 md:p-6">
        <Input label="Buscar por nombre o teléfono" placeholder="Escribe para filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefix={<Search className="h-4 w-4" />} containerClassName="max-w-xl" />
      </Card>

      <DataTable loading={initialLoading} isEmpty={!initialLoading && !actionLoading && patients.length === 0} emptyState={(
        <EmptyState icon={Search} title="No se encontraron registros activos" description="Intenta ajustar el texto de búsqueda para encontrar otro paciente." />
      )}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">Paciente</th>
              <th className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">Contacto</th>
              <th className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">Última actividad</th>
              <th className="px-6 py-4 text-right text-caption uppercase tracking-[0.14em] text-muted">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-surface-muted/60 transition-colors">
                <td className="px-6 py-5 align-top">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-ink">{patient.first_name?.[0]}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink leading-tight">{patient.first_name} {patient.last_name}</p>
                      <p className="text-caption text-muted">ID: {patient.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-ink"><Phone className="h-4 w-4 text-muted" /> <span>{patient.phone}</span></div>
                    {patient.email ? (<div className="flex items-center gap-2 text-muted"><Mail className="h-4 w-4 text-muted" /> <span className="break-all">{patient.email}</span></div>) : null}
                  </div>
                </td>
                <td className="px-6 py-5 align-top text-sm">
                  <p className="text-caption uppercase tracking-[0.14em] text-muted">Registro inicial</p>
                  <p className="mt-1 font-medium text-ink">{formatPatientDate(patient.created_at)}</p>
                </td>
                <td className="px-6 py-5 align-top text-right">
                  {user?.role === 'DOCTOR' ? (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/doctor/medical-records/${patient.id}`)}><FileText className="h-4 w-4" /> Expediente</Button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {(user?.role === 'RECEPTIONIST' || user?.role === 'OWNER') ? (
                        <Button size="sm" variant="secondary" onClick={() => openEditModal(patient)}>Editar datos</Button>
                      ) : null}
                      <Button size="sm" variant="ghost" disabled>Solo lectura</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      {errorMessage ? (
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink">{errorMessage}</div>
            <div className="flex items-center gap-2"><Button onClick={() => fetchPatients({ resetPage: false, usePage: page, usePageSize: pageSize, op: 'refresh' })}>Reintentar</Button></div>
          </div>
        </Card>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted">Mostrando {patients.length} de {total} pacientes</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1 || initialLoading || actionLoading === 'pagination'} onClick={() => { setPendingOp('pagination'); setPage((p) => Math.max(1, p - 1)); setActionLoading('pagination'); }}>Anterior</Button>
          <div className="text-sm">Página {page} / {totalPages}</div>
          <Button size="sm" variant="ghost" disabled={page >= totalPages || initialLoading || actionLoading === 'pagination'} onClick={() => { setPendingOp('pagination'); setPage((p) => Math.min(totalPages, p + 1)); setActionLoading('pagination'); }}>Siguiente</Button>
          <SelectControl label="" value={String(pageSize)} onChange={(e) => { setPendingOp('pagination'); setPageSize(Number(e.target.value)); setPage(1); setActionLoading('pagination'); }} options={[{ value: '10', label: '10' }, { value: '20', label: '20' }, { value: '50', label: '50' }]} />
        </div>
      </div>

      <Modal open={showModal} onClose={resetPatientModal} title={editingPatient ? 'Editar Paciente' : 'Registro de Paciente'} description={editingPatient ? 'Edita los datos básicos del paciente.' : 'Da de alta un paciente con validación básica de contacto.'} size="lg" footer={(
        <div className="flex items-center justify-end gap-3"><Button type="button" variant="secondary" onClick={resetPatientModal}>Descartar</Button><Button type="submit" form="patient-create-form">{editingPatient ? 'Guardar cambios' : 'Dar de Alta'}</Button></div>
      )}>
        <form id="patient-create-form" onSubmit={handleSavePatient} className="space-y-section">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Nombres" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            <Input label="Apellidos" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Fecha de nacimiento" type="date" required value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
            <SelectControl label="Género" required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} options={genderOptions} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Teléfono (WhatsApp)" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="CURP" value={formData.curp} onChange={(e) => setFormData({ ...formData, curp: e.target.value })} />
          </div>

          <Input label="Dirección legal" multiline rows={4} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        </form>
      </Modal>
    </DashboardSectionLayout>
    )
  );
}
