import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Building,
  ArrowUpRight,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import api from '../../lib/axios';

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    clinic_id: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, clinicRes] = await Promise.all([
        api.get('/dashboard/stats', { params: filters }),
        api.get('/clinics')
      ]);
      setStats(statsRes.data.data);
      setClinics(clinicRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const setRange = (rangeType) => {
    const now = new Date();
    let start = new Date();
    if (rangeType === 'today') start.setHours(0,0,0,0);
    if (rangeType === 'week') start.setDate(now.getDate() - 7);
    if (rangeType === 'month') start.setMonth(now.getMonth() - 1);
    
    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  };

  if (!stats && loading) return <div className="p-8 text-slate-600 font-medium italic">Sincronizando tablero corporativo...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-uppercase">Resumen Ejecutivo</h1>
          <p className="text-slate-500 mt-2 font-medium">Análisis de rendimiento financiero y operativo organizacional.</p>
        </div>

        {/* Global Filters Panel */}
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-wrap items-center gap-4">
          <div className="flex bg-white p-1 rounded border border-slate-200 shadow-sm">
            <button onClick={() => setRange('today')} className="px-4 py-1.5 text-[11px] font-bold text-slate-600 rounded transition-all hover:text-slate-900 uppercase tracking-wider">Hoy</button>
            <button onClick={() => setRange('week')} className="px-4 py-1.5 text-[11px] font-bold text-slate-600 rounded transition-all hover:text-slate-900 uppercase tracking-wider">Semana</button>
            <button onClick={() => setRange('month')} className="px-4 py-1.5 text-[11px] font-bold text-slate-600 rounded transition-all hover:text-slate-900 uppercase tracking-wider">Mes</button>
          </div>
          
          <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm">
             <Building className="h-3.5 w-3.5 text-slate-400" />
             <select 
               className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer uppercase tracking-tight"
               value={filters.clinic_id}
               onChange={(e) => setFilters({...filters, clinic_id: e.target.value})}
             >
               <option value="">Todas las sucursales</option>
               {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>

          <button 
            onClick={fetchStats}
            className={`p-2 rounded text-slate-600 hover:text-slate-900 transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm group hover:border-slate-400 transition-all">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Ingresos de Caja</p>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">${stats?.financial?.total_income?.toLocaleString() || '0'}</h3>
            <span className="text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 flex items-center">
              <TrendingUp className="h-2.5 w-2.5 mr-1" />
              CONFIRMADO
            </span>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-50 flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-wide">
            <Calendar className="h-3 w-3 mr-2" />
            Control de periodos
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm group hover:border-slate-400 transition-all">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Egresos Operativos</p>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">${stats?.financial?.total_expense?.toLocaleString() || '0'}</h3>
            <span className="text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 border border-rose-100 flex items-center">
              <TrendingDown className="h-2.5 w-2.5 mr-1" />
              EGRESADO
            </span>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-50 flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-wide">
            <RefreshCw className="h-3 w-3 mr-2" />
            Actualización Real
          </div>
        </div>

        <div className={`p-8 rounded-lg border shadow-md relative overflow-hidden transition-all duration-300 ${
          (stats?.financial?.net_balance || 0) >= 0 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-rose-900 border-rose-800'
        }`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <DollarSign className="h-16 w-16 text-white" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Margen Neto</p>
          <h3 className="text-4xl font-bold text-white tracking-tight">${stats?.financial?.net_balance?.toLocaleString() || '0'}</h3>
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center text-[11px] text-white/60 font-bold uppercase tracking-wide">
            <ArrowUpRight className="h-3 w-3 mr-2" />
            Rentabilidad Corporativa
          </div>
        </div>
      </div>

      {/* Internal Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
               <BarChart3 className="h-5 w-5 text-slate-900" />
               <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Actividad de Consultas</h4>
            </div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider italic">Métricas de Servicio</span>
          </div>
          
          <div className="space-y-6">
            {[
              { label: 'Citas Finalizadas', value: stats?.appointments?.completed, color: 'bg-slate-900' },
              { label: 'Citas Programadas', value: stats?.appointments?.pending, color: 'bg-slate-400' },
              { label: 'Cancelaciones / Ausencias', value: stats?.appointments?.cancelled, color: 'bg-rose-500' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item.label}</span>
                  <span className="text-lg font-bold text-slate-900">{item.value || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`${item.color} h-full transition-all duration-1000`} 
                    style={{ width: `${Math.min(100, (item.value / (stats?.appointments?.total || 1)) * 100)}%` }} 
                  />
                </div>
              </div>
            ))}

            <div className="pt-8 flex items-center justify-between border-t border-slate-50 mt-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Volumen Total Operativo</span>
              <span className="text-3xl font-bold text-slate-900 tracking-tighter">{stats?.appointments?.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-lg flex flex-col justify-between items-start text-white relative overflow-hidden shadow-xl border border-slate-950">
          <div className="absolute -bottom-12 -right-12 h-64 w-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none" />
          
          <div className="z-10 w-full">
            <h4 className="text-2xl font-bold mb-3 tracking-tight uppercase">Activos Organizacionales</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">Estructura de personal y sucursales actualmente activas bajo esta administración.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full mt-12 z-10">
            <div className="bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
              <span className="block text-4xl font-bold text-white mb-2">{stats?.infrastructure?.branches || 0}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Sucursales</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
              <span className="block text-4xl font-bold text-white mb-2">{stats?.infrastructure?.employees || 0}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Colaboradores</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
