import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Building, Users, CalendarDays, UserSquare2, DollarSign, Activity, FileText, MessageCircle } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const menuOptions = {
    SUPER_ADMIN: [
      { name: 'Dashboard Corporativo', path: '/superadmin/dashboard', icon: LayoutDashboard },
      { name: 'Entidades', path: '/superadmin/organizations', icon: Building },
    ],
    OWNER: [
      { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
      { name: 'Sucursales', path: '/owner/clinics', icon: Building },
      { name: 'Equipo Directivo', path: '/owner/team', icon: Users },
      { name: 'Gestión de Caja', path: '/billing/cash', icon: DollarSign },
      { name: 'WhatsApp Meta', path: '/owner/whatsapp', icon: MessageCircle },
      { name: 'Utilerías de Identidad', path: '/doctor/profile', icon: UserSquare2 },
    ],
    DOCTOR: [
      { name: 'Panel de Control', path: '/doctor/dashboard', icon: LayoutDashboard },
      { name: 'Agenda Médica', path: '/doctor/schedule', icon: CalendarDays },
      { name: 'Servicios Profesionales', path: '/doctor/services', icon: Activity },
      { name: 'Expedientes Clínicos', path: '/doctor/followup', icon: FileText },
      { name: 'Utilerías de Identidad', path: '/doctor/profile', icon: UserSquare2 },
    ],
    RECEPTIONIST: [
      { name: 'Calendario Operativo', path: '/reception/calendar', icon: CalendarDays },
      { name: 'Registro de Pacientes', path: '/reception/patients', icon: UserSquare2 },
      { name: 'Movimientos de Caja', path: '/billing/cash', icon: DollarSign },
    ]
  };

  const getMenuOptions = () => menuOptions[user?.role] || [];

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar Corporativo */}
      <aside className="w-72 bg-slate-900 flex flex-col shadow-2xl z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-800">
          <Activity className="h-6 w-6 text-slate-100 mr-3" />
          <span className="font-bold text-lg tracking-tight text-white uppercase">DentalCare <span className="text-[10px] text-slate-500 block -mt-1 font-medium tracking-widest">Enterprise</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1">
          {getMenuOptions().map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-md transition-all group ${
                  isActive 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className={`text-[13px] font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center px-2 mb-6">
            <div className="w-10 h-10 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold mr-3 shadow-inner">
              {user?.first_name?.[0]}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-all border border-transparent hover:border-rose-500/20 uppercase tracking-widest"
          >
            <LogOut className="h-3.5 w-3.5 mr-3" />
            Cerrar Sesión Activa
          </button>
        </div>
      </aside>

      {/* Area de Trabajo */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar sutil */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-8 justify-between z-10">
           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
             Sincronización segura de datos operativos
           </div>
           <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 uppercase">
              <FileText className="w-3 h-3" />
              <span>Version 2.4.0</span>
           </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
          <div className="absolute inset-0 bg-grid-slate-200/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
