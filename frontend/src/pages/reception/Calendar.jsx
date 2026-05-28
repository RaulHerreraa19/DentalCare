import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../lib/axios';
import { Calendar as CalendarIcon, Filter, MapPin, User, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../../components/ui';

export default function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      const controller = new AbortController();
      let mounted = true;
      (async () => {
        try {
          await fetchAppointments({ signal: controller.signal, mountedRef: { mountedRef: () => mounted } });
        } catch (e) {
          /* ignore */
        }
      })();

      return () => {
        mounted = false;
        controller.abort();
      };
    }
  }, [selectedClinic]);

  const fetchClinics = async () => {
    try {
      const res = await api.get('/clinics');
      setClinics(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedClinic(res.data.data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setClinicsLoading(false);
    }
  };

  const fetchAppointments = async ({ signal, mountedRef } = {}) => {
    try {
      setAppointmentsLoading(true);
      const today = new Date();
      // build UTC range: start at first day of previous month 00:00:00.000Z, end at last day of next month 23:59:59.999Z
      const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0, 23, 59, 59, 999));
      const start = startDate.toISOString();
      const end = endDate.toISOString();

      const params = {
        clinic_id: selectedClinic,
        start_date: start,
        end_date: end,
        page: 1,
        pageSize: 500,
      };

      const res = await api.get('/appointments', { params, signal });
      const payload = res.data?.data;
      if (payload && Array.isArray(payload.items)) {
        if (!mountedRef || mountedRef.mountedRef()) setAppointments(payload.items || []);
      } else if (Array.isArray(payload)) {
        if (!mountedRef || mountedRef.mountedRef()) setAppointments(payload);
      } else {
        if (!mountedRef || mountedRef.mountedRef()) setAppointments([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!mountedRef || mountedRef.mountedRef()) setAppointmentsLoading(false);
    }
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedDate({
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
    setShowCreateModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const appointment = appointments.find(a => a.id === clickInfo.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowBillingModal(true);
    }
  };

  const events = appointments.map(app => ({
    id: app.id,
    title: `${app.patient.last_name}, ${app.patient.first_name} | Dr. ${app.doctor.last_name}`,
    start: app.start_time,
    end: app.end_time,
    backgroundColor: app.is_paid ? '#0f172a' : (app.status === 'CANCELLED' ? '#ef4444' : (app.status === 'IN_PROGRESS' ? '#f59e0b' : '#3b82f6')),
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: { ...app }
  }));

  return (
    clinicsLoading || appointmentsLoading ? <LoadingScreen title="Cargando calendario operativo" description="Sincronizando clínicas y citas" /> : (
    <div className="p-8 h-screen flex flex-col bg-slate-50 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda Operativa</h1>
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Gestión centralizada de citas y servicios</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select 
            value={selectedClinic} 
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 outline-none cursor-pointer uppercase tracking-tight pr-8"
          >
            {clinics.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-grow bg-white p-6 rounded-lg border border-slate-200 shadow-sm overflow-hidden formal-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
          }}
          locale="es"
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          height="100%"
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
        />
      </div>

      {showCreateModal && (
        <CreateAppointmentModal 
          selectedDate={selectedDate} 
          clinicId={selectedClinic}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAppointments();
          }}
        />
      )}

      {showBillingModal && selectedAppointment && (
        <BillingModal
          appointment={selectedAppointment}
          onClose={() => setShowBillingModal(false)}
          onSuccess={() => {
            setShowBillingModal(false);
            fetchAppointments();
          }}
        />
      )}
    </div>
    )
  );
}

// ======================= MODAL CREAR CITA (REDISEÑO FORMAL) =======================
function CreateAppointmentModal({ selectedDate, clinicId, onClose, onSuccess }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null); // full object for display when not in current page
  const [doctors, setDoctors] = useState([]);
  const [offices, setOffices] = useState([]);
  const [initialPatientsLoading, setInitialPatientsLoading] = useState(true);
  const [patientsActionLoading, setPatientsActionLoading] = useState(null); // 'search' | 'pagination' | null
  const [patientsError, setPatientsError] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [debouncedPatientQuery, setDebouncedPatientQuery] = useState('');
  const [patientPage, setPatientPage] = useState(1);
  const [patientPageSize, setPatientPageSize] = useState(10);
  const [patientTotal, setPatientTotal] = useState(0);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const [pendingOpPatient, setPendingOpPatient] = useState(null);
  const inflightPatientsKeyRef = useRef(null);
  const selectedPatientFetchIdRef = useRef(0);

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    office_id: '',
    start_time: selectedDate?.start || '',
    end_time: selectedDate?.end || '',
    reason: ''
  });

  const { user } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    // load other static lists; patient list will be loaded by central effect
    api.get('/users/team').then(res => {
      setDoctors((res.data.data || []).filter(u => u.role === 'DOCTOR'));
    }).catch(console.error);
    if (clinicId) {
      api.get(`/clinics/${clinicId}/offices`).then(res => setOffices(res.data.data || [])).catch(console.error);
    }
    setPendingOpPatient('initial');
  }, [clinicId]);

  // when a patient_id is selected but not present in current `patients`, fetch its details
  useEffect(() => {
    const pid = formData.patient_id;
    if (!pid) {
      setSelectedPatient(null);
      return;
    }

    // if already in current page, use that object
    const found = patients.find(p => p.id === pid);
    if (found) {
      setSelectedPatient(found);
      return;
    }

    // otherwise fetch single patient to keep label stable; guard with fetch id to avoid stale overwrite
    const fetchId = ++selectedPatientFetchIdRef.current;
    (async () => {
      try {
        const res = await api.get(`/patients/${pid}`);
        if (fetchId !== selectedPatientFetchIdRef.current) return;
        if (!mountedRef.current) return;
        const p = res.data.data;
        // If backend returned an organization_id and it doesn't match current user's org, treat as unauthorized
        if (p && p.organization_id && user && p.organization_id !== user.organization_id) {
          console.warn('Selected patient belongs to a different organization — ignoring');
          setPatientsError('No tiene permiso para ver los detalles de este paciente.');
          setSelectedPatient(null);
          setFormData({ ...formData, patient_id: '' });
          return;
        }
        setSelectedPatient(p);
      } catch (err) {
        console.error('Could not fetch selected patient', err);
        if (!mountedRef.current) return;
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setPatientsError(err.response.data?.message || 'No autorizado para ver este paciente');
          setSelectedPatient(null);
          setFormData({ ...formData, patient_id: '' });
        }
      }
    })();
  }, [formData.patient_id, patients]);

  const fetchPatients = async ({ resetPage = false, usePage = patientPage, usePageSize = patientPageSize, q = undefined, op = 'refresh' } = {}) => {
    const query = typeof q !== 'undefined' ? q : debouncedPatientQuery || undefined;
    const targetPage = resetPage ? 1 : usePage;
    try {
      setPatientsError('');
      if (op === 'initial') setInitialPatientsLoading(true);
      else setPatientsActionLoading(op);

      const key = JSON.stringify({ q: query || undefined, page: targetPage, pageSize: usePageSize });
      if (inflightPatientsKeyRef.current && inflightPatientsKeyRef.current === key) return;
      inflightPatientsKeyRef.current = key;

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const reqId = ++requestIdRef.current;

      const params = {
        mode: 'paginated',
        q: query || undefined,
        page: targetPage,
        pageSize: usePageSize,
        sortBy: 'created_at',
        sortDir: 'desc'
      };

      const res = await api.get('/patients', { params, signal: controller.signal });
      if (reqId !== requestIdRef.current) return;
      if (!mountedRef.current) return;

      const payload = res.data?.data;
      if (payload && !Array.isArray(payload) && Array.isArray(payload.items)) {
        if (mountedRef.current) {
          setPatients(payload.items || []);
          setPatientTotal(typeof payload.total === 'number' ? payload.total : payload.items.length);
          setPatientPage(payload.page || targetPage);
        }
      } else if (Array.isArray(payload)) {
        const all = payload;
        if (mountedRef.current) {
          setPatients(all.slice((targetPage - 1) * usePageSize, (targetPage - 1) * usePageSize + usePageSize));
          setPatientTotal(all.length);
          setPatientPage(targetPage);
        }
      } else {
        if (mountedRef.current) {
          setPatients([]);
          setPatientTotal(0);
          setPatientPage(1);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      const status = err.response?.status;
      if (mountedRef.current) {
        if (status === 401) {
          setPatientsError('No autorizado. Por favor inicia sesión.');
          setPatients([]);
          setSelectedPatient(null);
          setFormData({ ...formData, patient_id: '' });
        } else if (status === 403) {
          setPatientsError('No tienes permisos para listar pacientes.');
          setPatients([]);
          setSelectedPatient(null);
          setFormData({ ...formData, patient_id: '' });
        } else {
          setPatientsError(err.response?.data?.message || 'Error al cargar pacientes');
        }
      }
    } finally {
      if (mountedRef.current) {
        if (op === 'initial') setInitialPatientsLoading(false);
        else setPatientsActionLoading(null);
      }
      // always clear refs
      abortControllerRef.current = null;
      inflightPatientsKeyRef.current = null;
    }
  };

  // Clear selection and patient list on auth/org changes to avoid stale cross-tenant data
  useEffect(() => {
    setPatients([]);
    setSelectedPatient(null);
    setFormData({ ...formData, patient_id: '' });
    setPatientsError('');
    setPendingOpPatient('initial');
  }, [user?.organization_id]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPendingOpPatient('search');
      setDebouncedPatientQuery(patientQuery);
      setPatientPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  // Centralized patient fetch trigger
  useEffect(() => {
    const op = pendingOpPatient || (initialPatientsLoading ? 'initial' : 'refresh');
    fetchPatients({ resetPage: false, usePage: patientPage, usePageSize: patientPageSize, op }).catch(() => {});
    setPendingOpPatient(null);
  }, [debouncedPatientQuery, patientPage, patientPageSize, pendingOpPatient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', { ...formData, clinic_id: clinicId });
      Swal.fire({
        icon: 'success',
        title: 'Cita Agendada',
        text: 'La consulta ha sido reservada correctamente.',
        confirmButtonColor: '#0f172a',
        timer: 1500
      });
      onSuccess();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Agenda',
        text: error.response?.data?.message || 'No se pudo registrar la cita en este horario.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Nueva Cita Programada</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Paciente</label>
              <div className="flex gap-2 items-center">
                <input
                  placeholder="Buscar paciente por nombre o teléfono"
                  value={patientQuery}
                  onChange={e => setPatientQuery(e.target.value)}
                  className="flex-1 border border-slate-200 rounded p-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                />
                <div className="text-xs text-muted">
                  {patientsActionLoading ? 'Buscando...' : (patientTotal ? `${patientTotal} resultados` : '')}
                </div>
              </div>

              <div className="mt-2">
                {patientsError ? (
                  <div className="text-sm text-red-600 flex items-center justify-between">
                    <span>{patientsError}</span>
                    <button type="button" className="text-sm underline" onClick={() => fetchPatients({ resetPage: false, usePage: patientPage, usePageSize: patientPageSize, op: 'refresh' })}>Reintentar</button>
                  </div>
                ) : null}

                <select required className="w-full border border-slate-200 rounded p-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900 mt-2"
                  disabled={initialPatientsLoading}
                  value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {/* ensure selectedPatient is always present as an option */}
                  {selectedPatient && !patients.find(p => p.id === selectedPatient.id) ? (
                    <option key={selectedPatient.id} value={selectedPatient.id}>{selectedPatient.last_name}, {selectedPatient.first_name}</option>
                  ) : null}
                  {patients?.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
                </select>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-muted">Mostrando página {patientPage}</div>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={patientPage <= 1 || initialPatientsLoading || patientsActionLoading === 'pagination'} onClick={() => { setPatientPage(p => Math.max(1, p - 1)); setPatientsActionLoading('pagination'); }} className="text-sm px-2 py-1 border rounded">Anterior</button>
                    <button type="button" disabled={initialPatientsLoading || patientsActionLoading === 'pagination'} onClick={() => { setPatientPage(p => p + 1); setPatientsActionLoading('pagination'); }} className="text-sm px-2 py-1 border rounded">Siguiente</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Médico Responsable</label>
                <select required className="w-full border border-slate-200 rounded p-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                  value={formData.doctor_id} onChange={e => setFormData({...formData, doctor_id: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {doctors?.map(d => <option key={d.id} value={d.id}>Dr. {d.last_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Consultorio</label>
                <select required className="w-full border border-slate-200 rounded p-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                  value={formData.office_id} onChange={e => setFormData({...formData, office_id: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {offices?.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Inicio</label>
                <input type="datetime-local" required className="w-full border border-slate-200 rounded p-2.5 text-sm outline-none"
                  value={formData.start_time.substring(0, 16)} onChange={e => setFormData({...formData, start_time: new Date(e.target.value).toISOString()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Término</label>
                <input type="datetime-local" required className="w-full border border-slate-200 rounded p-2.5 text-sm outline-none"
                  value={formData.end_time.substring(0, 16)} onChange={e => setFormData({...formData, end_time: new Date(e.target.value).toISOString()})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Motivo de Consulta (Opcional)</label>
              <textarea className="w-full border border-slate-200 rounded p-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900 min-h-[80px]"
                value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Descripción breve..." />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded uppercase tracking-widest">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 uppercase tracking-widest">Confirmar Cita</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================= MODAL DETALLES / COBRO (REDISEÑO FORMAL) =======================
function BillingModal({ appointment, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const finalAmount = Number(appointment.total_amount || 0);

  const handlePayment = async () => {
    try {
      await api.post(`/billing/collect/${appointment.id}`, { paymentMethod });
      Swal.fire({
        icon: 'success',
        title: 'Pago Procesado',
        text: 'La transacción ha sido registrada en tesorería.',
        confirmButtonColor: '#0f172a',
        timer: 1500
      });
      onSuccess();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Cobro',
        text: error.response?.data?.message || 'No se pudo procesar la liquidación.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar Cancelación?',
      text: "Esta acción marcará la cita como anulada definitivamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, Anular Cita',
      cancelButtonText: 'Mantener'
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/appointments/${appointment.id}/status`, { status: 'CANCELLED' });
        Swal.fire({
          icon: 'success',
          title: 'Cita Anulada',
          text: 'La cita ha sido retirada de la agenda operativa.',
          confirmButtonColor: '#0f172a',
          timer: 1500
        });
        onSuccess();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo completar la anulación.',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
           <h2 className="text-lg font-bold uppercase tracking-widest">Detalles del Servicio</h2>
           <p className="text-slate-400 text-xs mt-1 font-medium">{appointment.id.substring(0,8).toUpperCase()}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
               <User className="w-4 h-4 text-slate-400 mt-0.5" />
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paciente</div>
                  <div className="text-sm font-bold text-slate-900">{appointment.patient.first_name} {appointment.patient.last_name}</div>
               </div>
            </div>
            <div className="flex items-start space-x-3">
               <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</div>
                  <div className="text-sm font-bold text-slate-900 uppercase">{new Date(appointment.start_time).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</div>
               </div>
            </div>
            <div className="flex items-start space-x-3">
               <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</div>
                  <div className="text-sm font-bold text-slate-900">{appointment.office?.name || 'No registrada'}</div>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 italic text-[11px] text-slate-400 text-center">
            {appointment.status === 'IN_PROGRESS' ? 'SERVICIO FINALIZADO - PENDIENTE DE COBRO' : `ESTADO: ${appointment.status}`}
          </div>

          {!appointment.is_paid && appointment.status !== 'CANCELLED' ? (
            <div className="space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-100">
               {appointment.services?.length > 0 && (
                 <div className="space-y-2">
                   <div className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Servicios aplicados</div>
                   <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                     {appointment.services.map((serviceItem) => (
                       <div key={serviceItem.id} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-4 py-3 text-sm">
                         <div className="min-w-0">
                           <div className="font-bold text-slate-900 truncate">{serviceItem.name}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicio profesional</div>
                         </div>
                         <div className="text-[11px] font-black text-slate-700">+${Number(serviceItem.price || 0).toFixed(2)}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                 <div className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Monto Neto a Liquidar</div>
                 <div className="text-3xl font-black text-slate-900">${finalAmount.toFixed(2)}</div>
                 <p className="text-[10px] text-slate-400 mt-2 text-center font-bold">Monto final bloqueado desde la consulta médica.</p>
               </div>

               <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Método de Pago</label>
                 <select
                   className="w-full bg-white border border-slate-200 rounded p-3 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                   value={paymentMethod}
                   onChange={(e) => setPaymentMethod(e.target.value)}
                 >
                   <option value="CASH">Efectivo</option>
                   <option value="TRANSFER">Transferencia</option>
                   <option value="CARD">Tarjeta / Terminal</option>
                 </select>
               </div>
               
               <button onClick={handlePayment} className="w-full py-3 bg-slate-900 text-white rounded text-xs font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center space-x-2 uppercase tracking-widest">
                 <CheckCircle2 className="w-4 h-4" />
                 <span>Procesar Pago</span>
               </button>
            </div>
          ) : (
             <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Liquidado</div>
               <div className="text-3xl font-black text-slate-900">${finalAmount.toFixed(2)}</div>
               {appointment.is_paid && <div className="text-[10px] font-bold text-emerald-600 flex items-center justify-center uppercase tracking-widest"><CheckCircle2 className="w-3 h-3 mr-1" /> Transacción Exitosa</div>}
             </div>
          )}

          <div className="flex flex-col space-y-2 pt-2">
            {!appointment.is_paid && appointment.status !== 'CANCELLED' && (
               <button onClick={handleCancel} className="w-full py-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded transition-all uppercase tracking-widest border border-transparent hover:border-rose-100">
                 Anular Cita
               </button>
            )}
            <button onClick={onClose} className="w-full py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-all uppercase tracking-widest">
              Cerrar Detalle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
