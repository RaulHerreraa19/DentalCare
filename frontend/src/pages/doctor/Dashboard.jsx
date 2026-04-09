import React, { useState, useEffect } from 'react';
import { Calendar, Users, Activity, Clock, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingServices: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch appointments for today
        const appointmentsRes = await api.get(`/appointments?start_date=${today}T00:00:00Z&end_date=${today}T23:59:59Z`);
        
        // Fetch patients count
        const patientsRes = await api.get('/patients');
        
        setStats({
          todayAppointments: appointmentsRes.data.data.length,
          totalPatients: patientsRes.data.data.length,
          pendingServices: 0 // Placeholder
        });

        // Get first 3 upcoming ones
        setUpcomingAppointments(appointmentsRes.data.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8">Cargando dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo, Dr.</h1>
        <p className="text-gray-500">Aquí tienes un resumen de tu jornada para hoy.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-primary-50 rounded-xl mr-4">
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Citas Hoy</p>
            <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-xl mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pacientes Totales</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-xl mr-4">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Estado</p>
            <p className="text-2xl font-bold text-gray-900 text-green-600">Activo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Próximas Citas</h2>
            <Link to="/doctor/schedule" className="text-sm text-primary-600 font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="p-6 flex items-center hover:bg-gray-50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold mr-4">
                    {app.patient.first_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{app.patient.first_name} {app.patient.last_name}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-400">No tienes más citas programadas para hoy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Acceso Rápido</h2>
            <p className="text-primary-100 mb-6">Gestiona tus servicios y agenda en un clic.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/doctor/schedule" className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-colors backdrop-blur-sm border border-white/10">
              <Calendar className="h-6 w-6 mb-2" />
              <p className="font-medium">Abrir Agenda</p>
            </Link>
            <Link to="/doctor/services" className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-colors backdrop-blur-sm border border-white/10">
              <Activity className="h-6 w-6 mb-2" />
              <p className="font-medium">Servicios</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
