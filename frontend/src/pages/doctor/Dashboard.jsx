import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Activity, Clock, ChevronRight, FileText } from 'lucide-react';
import api from '../../lib/axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, DashboardSectionLayout, KPIStatCard, LoadingScreen } from '../../components/ui';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingServices: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');
  const requestIdRef = useRef(0);
  const { user } = useAuth();

  useEffect(() => {
    let abortController = null;
    const fetchDashboardData = async () => {
      abortController = new AbortController();
      const reqId = ++requestIdRef.current;
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch appointments for today (primary)
        const start = `${today}T00:00:00.000Z`;
        const end = `${today}T23:59:59.999Z`;

        const params = { start_date: start, end_date: end, doctor_id: user?.id, page: 1, pageSize: 100 };
        const appointmentsRes = await api.get('/appointments', { signal: abortController.signal, params });
        if (reqId !== requestIdRef.current) return;

        const payload = appointmentsRes.data?.data || [];
        const allApps = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];

        setUpcomingAppointments(allApps.slice(0, 3));
        setStats((s) => ({ ...s, todayAppointments: allApps.length }));

        // Fetch patients count separately; non-blocking for dashboard render
        setPatientsError('');
        setPatientsLoading(true);
        try {
          const patientsRes = await api.get('/patients/doctor', { signal: abortController.signal });
          if (reqId !== requestIdRef.current) return;
          const payload = patientsRes.data?.data;
          const totalPatientsCount = Array.isArray(payload) ? payload.length : (payload?.total || 0);
          setStats((s) => ({ ...s, totalPatients: totalPatientsCount }));
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.error('Error fetching patients count:', err);
          setPatientsError(err.response?.data?.message || 'No se pudo cargar el conteo de pacientes');
          setStats((s) => ({ ...s, totalPatients: null }));
        } finally {
          setPatientsLoading(false);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching dashboard data:', error);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchDashboardData();

    return () => {
      if (abortController) abortController.abort();
      // bump reqIdRef to invalidate in-flight handlers
      requestIdRef.current++;
    };
  }, []);

  if (appointmentsLoading || patientsLoading) {
    return <LoadingScreen title="Cargando panel del doctor" description="Sincronizando citas y pacientes" />;
  }

  return (
    <DashboardSectionLayout
      eyebrow="Atención clínica"
      title="Panel del doctor"
      description="Resumen operativo del día con acceso rápido a agenda, pacientes y expedientes."
      containerClassName="mx-auto max-w-7xl px-layout py-layout animate-in fade-in duration-500"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KPIStatCard
          title="Citas hoy"
          value={stats.todayAppointments}
          tone="primary"
          badge="Agenda"
          icon={Calendar}
          footer="Consultas del día"
        />
        <KPIStatCard
          title="Pacientes totales"
          value={stats.totalPatients ?? '—'}
          tone="accent"
          badge="Directorio"
          icon={Users}
          footer={patientsError ? patientsError : 'Pacientes vinculados'}
          footerClassName={patientsError ? 'text-danger-600' : undefined}
        />
        <KPIStatCard
          title="Estado"
          value="Activo"
          tone="success"
          badge="En línea"
          icon={Activity}
          footer="Operación clínica"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-muted px-6 py-5">
            <div className="space-y-1">
              <p className="text-label text-muted">Agenda inmediata</p>
              <h2 className="text-section-title text-ink">Próximas citas</h2>
            </div>
            <Button as={Link} to="/doctor/schedule" size="sm" variant="secondary">
              Ver todas
            </Button>
          </div>

          <div className="divide-y divide-border bg-surface">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-surface-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-ink">
                    {app.patient.first_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{app.patient.first_name} {app.patient.last_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-caption text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-body text-muted">No tienes más citas programadas para hoy.</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-label text-muted">Acceso directo</p>
            <h2 className="text-section-title text-ink">Atajos clínicos</h2>
            <p className="text-body text-muted">Ingresa rápidamente a los flujos más usados durante consulta.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button as={Link} to="/doctor/patients" variant="secondary" className="justify-start">
              <Users className="h-4 w-4" />
              Pacientes
            </Button>
            <Button as={Link} to="/doctor/records" variant="secondary" className="justify-start">
              <FileText className="h-4 w-4" />
              Expedientes
            </Button>
            <Button as={Link} to="/doctor/schedule" variant="secondary" className="justify-start">
              <Calendar className="h-4 w-4" />
              Abrir agenda
            </Button>
            <Button as={Link} to="/doctor/services" variant="secondary" className="justify-start">
              <Activity className="h-4 w-4" />
              Servicios
            </Button>
          </div>
        </Card>
      </div>
    </DashboardSectionLayout>
  );
}
