import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle, User, FileText, LayoutDashboard, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showAttendModal, setShowAttendModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchAppointments();
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

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const res = await api.get(`/appointments?clinic_id=${selectedClinic}&start_date=${start}&end_date=${end}`);
      let docsApps = res.data.data.filter(a => a.doctor.id === user.id);
      setAppointments(docsApps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendClick = (app) => {
    setSelectedAppointment(app);
    setShowAttendModal(true);
  };

  if (loading && clinics.length === 0) return <div className="p-8 text-slate-600 font-medium italic">Sincronizando agenda médica...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda de Consultas</h1>
          <p className="text-slate-500 mt-2 font-medium">Panel operativo de citas programadas y seguimiento clínico.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select 
            value={selectedClinic} 
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="text-[11px] font-bold text-slate-700 bg-transparent border-none focus:ring-0 outline-none cursor-pointer uppercase tracking-tight pr-8"
          >
            {clinics.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {appointments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {appointments.map((app) => (
              <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-6 group">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold mr-5 shadow-sm group-hover:bg-white transition-colors">
                    {app.patient.first_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg tracking-tight">{app.patient.first_name} {app.patient.last_name}</p>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 space-x-6">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2 text-slate-300" />
                        {new Date(app.start_time).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-2 text-slate-300" />
                        {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                    app.is_paid 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 italic' 
                      : (app.status === 'CANCELLED' 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : (app.status === 'IN_PROGRESS' 
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-100 text-slate-500 border-slate-200'))
                  }`}>
                    {app.status === 'IN_PROGRESS' ? 'Consulta Finalizada' : app.status}
                  </span>
                  
                  <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block"></div>

                  <button 
                    onClick={() => navigate(`/doctor/medical-records/${app.patient.id}`)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-all flex items-center h-10 px-4"
                    title="Ver Expediente"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Expediente</span>
                  </button>

                  {(!app.is_paid && app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && app.status !== 'IN_PROGRESS') && (
                    <button 
                      onClick={() => navigate(`/doctor/medical-records/${app.patient.id}?appointmentId=${app.id}`)}
                      className="h-10 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded hover:bg-black transition-all shadow-lg shadow-slate-200"
                    >
                      Iniciar Consulta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center opacity-40">
            <Calendar className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin compromisos programados</h3>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendModal({ appointment, onClose, onSuccess }) {
  const [totalAmount, setTotalAmount] = useState(500);
  const [loading, setLoading] = useState(false);

  const handleAttend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { 
        status: 'IN_PROGRESS', 
        total_amount: totalAmount 
      });
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al reportar la consulta');
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
          <div className="bg-slate-50 p-6 rounded border border-slate-100">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Honorarios sugeridos a Recepción</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">$</span>
              </div>
              <input 
                type="number" 
                step="0.01"
                required
                autofocus
                className="w-full bg-white border border-slate-200 rounded p-3 text-2xl font-black text-slate-900 text-right focus:ring-1 focus:ring-slate-900 outline-none"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-4 leading-relaxed text-center font-bold italic uppercase">Monto sujeto a confirmación por el personal administrativo al momento de liquidar en caja.</p>
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
