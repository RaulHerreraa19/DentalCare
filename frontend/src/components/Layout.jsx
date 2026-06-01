import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Building, Users, CalendarDays, UserSquare2, DollarSign, Activity, FileText, MessageCircle, FileBarChart2 } from 'lucide-react';

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
      { name: 'Reportes', path: '/reports', icon: FileBarChart2 },
    ],
    OWNER: [
      { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
      { name: 'Sucursales', path: '/owner/clinics', icon: Building },
      { name: 'Equipo Directivo', path: '/owner/team', icon: Users },
      { name: 'Gestión de Caja', path: '/billing/cash', icon: DollarSign },
      { name: 'Reportes', path: '/reports', icon: FileBarChart2 },
      { name: 'WhatsApp Meta', path: '/owner/whatsapp', icon: MessageCircle },
      { name: 'Utilerías de Identidad', path: '/doctor/profile', icon: UserSquare2 },
    ],
    DOCTOR: [
      { name: 'Panel de Control', path: '/doctor/dashboard', icon: LayoutDashboard },
      { name: 'Pacientes del Doctor', path: '/doctor/patients', icon: Users },
      { name: 'Expedientes Médicos', path: '/doctor/records', icon: FileText },
      { name: 'Agenda Médica', path: '/doctor/schedule', icon: CalendarDays },
      { name: 'Servicios Profesionales', path: '/doctor/services', icon: Activity },
      { name: 'Reportes', path: '/reports', icon: FileBarChart2 },
      { name: 'Utilerías de Identidad', path: '/doctor/profile', icon: UserSquare2 },
    ],
    RECEPTIONIST: [
      { name: 'Calendario Operativo', path: '/reception/calendar', icon: CalendarDays },
      { name: 'Registro de Pacientes', path: '/reception/patients', icon: UserSquare2 },
      { name: 'Movimientos de Caja', path: '/billing/cash', icon: DollarSign },
      { name: 'Reportes', path: '/reports', icon: FileBarChart2 },
    ]
  };

  const getMenuOptions = () => menuOptions[user?.role] || [];

  return (
    <div className="flex h-screen bg-canvas text-ink antialiased">
      <aside className="z-20 flex w-72 flex-col border-r border-border bg-surface shadow-panel">
        <div className="flex h-20 items-center border-b border-border px-8">
          <Activity className="mr-3 h-5 w-5 text-primary-600" />
          <span className="text-base font-semibold tracking-tight text-ink">
            DentalCare
            <span className="mt-0.5 block text-caption font-medium uppercase tracking-[0.16em] text-muted">Enterprise</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-8">
          {getMenuOptions().map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center rounded-control px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-surface-muted text-ink'
                    : 'text-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                <Icon className={`mr-3 h-4 w-4 transition-colors ${isActive ? 'text-primary-600' : 'text-muted group-hover:text-ink'}`} />
                <span className="text-body leading-none">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border bg-surface-muted p-6">
          <div className="mb-5 flex items-center px-1">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface text-sm font-semibold text-ink">
              {user?.first_name?.[0]}
            </div>
            <div className="truncate">
              <p className="truncate text-sm font-medium text-ink">{user?.first_name} {user?.last_name}</p>
              <p className="mt-0.5 text-caption uppercase tracking-[0.14em] text-muted">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-control border border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-900"
          >
            <LogOut className="mr-3 h-3.5 w-3.5" />
            Cerrar Sesión Activa
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-layout shadow-soft">
          <div className="text-caption font-semibold uppercase tracking-[0.14em] text-muted">
            Sincronización segura de datos operativos
          </div>
          <div className="flex items-center gap-1 text-caption font-semibold uppercase text-muted">
              <FileText className="w-3 h-3" />
              <span>Version 2.4.0</span>
          </div>
        </header>

        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-canvas">
          <div className="absolute inset-0 bg-grid-slate-200/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
