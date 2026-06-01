import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, FileText, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, DashboardSectionLayout, EmptyState, LoadingScreen, SelectControl } from '../../components/ui';

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

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
    }
  };

  const fetchAppointments = async ({ signal, mountedRef } = {}) => {
    try {
      setLoading(true);
      const today = new Date();
      // UTC-aware range (yesterday to end of next month)
      const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      const start = startDate.toISOString();
      const end = endDate.toISOString();

      const params = {
        clinic_id: selectedClinic,
        start_date: start,
        end_date: end,
        doctor_id: user?.id,
        page: 1,
        pageSize: 500,
      };

      const res = await api.get('/appointments', { params, signal });
      const payload = res.data?.data;
      const apps = payload && Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      // Server-side scoping by doctor_id is requested; we still defensively filter if needed
      const docsApps = apps.filter(a => a.doctor?.id === user?.id);
      if (!mountedRef || mountedRef.mountedRef()) setAppointments(docsApps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && clinics.length === 0) {
    return <LoadingScreen title="Cargando agenda médica" description="Sincronizando citas del doctor" />;
  }

  return (
    <DashboardSectionLayout
      eyebrow="Agenda clínica"
      title="Agenda de consultas"
      description="Panel operativo de citas programadas y seguimiento clínico por sucursal."
      containerClassName="mx-auto max-w-7xl px-layout py-layout animate-in fade-in duration-500"
      actions={(
        <div className="w-full sm:w-72">
          <SelectControl
            label="Filtrar por sucursal"
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            prefix={<Filter className="h-4 w-4" />}
          >
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </SelectControl>
        </div>
      )}
    >
      <Card className="overflow-hidden">
        {appointments.length > 0 ? (
          <div className="divide-y divide-border bg-surface">
            {appointments.map((app) => {
              const statusClass = app.is_paid
                ? 'border-success-100 bg-success-50 text-success-900'
                : app.status === 'CANCELLED'
                  ? 'border-danger-100 bg-danger-50 text-danger-900'
                  : app.status === 'IN_PROGRESS'
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-border bg-surface-muted text-muted';

              return (
                <div key={app.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-ink">
                      {app.patient.first_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{app.patient.first_name} {app.patient.last_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(app.start_time).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={`inline-flex items-center rounded-control border px-3 py-1 text-caption uppercase tracking-[0.14em] ${statusClass}`}>
                      {app.status === 'IN_PROGRESS' ? 'Consulta finalizada' : app.status}
                    </span>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/doctor/medical-records/${app.patient.id}`)}
                      title="Ver expediente"
                    >
                      <FileText className="h-4 w-4" />
                      Expediente
                    </Button>

                    {(!app.is_paid && app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && app.status !== 'IN_PROGRESS') ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/doctor/medical-records/${app.patient.id}?appointmentId=${app.id}`)}
                      >
                        Iniciar consulta
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="Sin compromisos programados"
            description="No hay citas registradas para la sucursal y rango de fechas actual."
            className="m-6"
          />
        )}
      </Card>
    </DashboardSectionLayout>
  );
}

function AttendModal({ appointment, onClose, onSuccess }) {
  const [baseAmount, setBaseAmount] = useState(500);
  const [services, setServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services');
        if (mounted) {
          setServices(data.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setCatalogLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds],
  );

  const servicesTotal = useMemo(
    () => selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServices],
  );

  const totalAmount = Number(baseAmount || 0) + servicesTotal;

  const toggleService = (serviceId) => {
    setSelectedServiceIds((current) => (
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    ));
  };

  const handleAttend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { 
        status: 'IN_PROGRESS', 
        total_amount: totalAmount,
        service_ids: selectedServiceIds,
      });
      onSuccess();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Sincronización',
        text: error.response?.data?.message || 'No se pudo reportar el cierre de la consulta.',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-slate-950 p-6 text-white text-center">
           <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Cierre de Consulta</h2>
           <p className="text-slate-400 text-[10px] mt-1 font-medium">{appointment.patient.first_name} {appointment.patient.last_name}</p>
        </div>
        
        <form onSubmit={handleAttend} className="p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded border border-slate-100 space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Honorario base de consulta</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">$</span>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full bg-white border border-slate-200 rounded p-3 text-2xl font-black text-slate-900 text-right focus:ring-1 focus:ring-slate-900 outline-none"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Servicios Profesionales</label>
              {catalogLoading ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">Cargando catálogo...</p>
              ) : services.length > 0 ? (
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {services.map((service) => {
                    const checked = selectedServiceIds.includes(service.id);
                    return (
                      <label key={service.id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-all ${checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-slate-900"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black uppercase tracking-widest truncate">{service.name}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${checked ? 'text-slate-200' : 'text-slate-400'}`}>Servicio adicional</div>
                          </div>
                        </div>
                        <div className="text-xs font-black">+${parseFloat(service.price || 0).toFixed(2)}</div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">No hay servicios activos en tu catálogo</p>
              )}
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Total estimado</div>
              <div className="text-3xl font-black text-emerald-950">${Number(totalAmount || 0).toFixed(2)}</div>
              {selectedServices.length > 0 && (
                <div className="mt-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  Base ${Number(baseAmount || 0).toFixed(2)} + Servicios ${servicesTotal.toFixed(2)}
                </div>
              )}
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed text-center font-bold italic uppercase">El total se enviará como monto final a recepción y no podrá alterarse ahí.</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded transition-all uppercase tracking-widest"
              disabled={loading}
            >
              Cerrar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-slate-900 text-white text-xs font-bold rounded hover:bg-black transition-all shadow-lg shadow-slate-200 uppercase tracking-widest"
              disabled={loading}
            >
              {loading ? 'Sincronizando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
