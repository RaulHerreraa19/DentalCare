import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, 
  Users, 
  ArrowLeft, 
  Settings, 
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Shield,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import api from '../../lib/axios';

export default function OrganizationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/organizations/${id}`);
      setOrg(res.data.data);
    } catch (error) {
      console.error('Error fetching org details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando detalles del negocio...</div>;
  if (!org) return <div className="p-8 text-center text-red-500 font-bold">Error: Negocio no encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/superadmin/organizations')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {org.is_active ? 'Activo' : 'Suspendido'}
              </span>
            </div>
            <p className="text-sm text-gray-500 italic">Identificador único: {org.slug}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </button>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
            <Shield className="h-4 w-4 mr-2" />
            Cambiar Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3">Resumen General</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Plan Actual</span>
                <span className="text-sm font-black text-primary-600 bg-primary-50 px-2 py-1 rounded">{org.plan}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Fecha Registro</span>
                <span className="text-gray-900 font-bold">{new Date(org.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Sucursales</span>
                <span className="text-gray-900 font-bold">{org._count?.clinics || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Personal</span>
                <span className="text-gray-900 font-bold">{org._count?.users || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Pacientes</span>
                <span className="text-gray-900 font-bold">{org._count?.patients || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-primary-700 p-6 rounded-3xl shadow-lg text-white">
            <LayoutDashboard className="h-8 w-8 mb-4 opacity-50" />
            <h4 className="text-lg font-bold mb-2">Salud del Negocio</h4>
            <p className="text-white/70 text-sm mb-6">Este cliente ha mantenido su suscripción activa durante el último año sin incidentes.</p>
            <div className="flex items-center text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-2 rounded-xl border border-white/20">
               <CheckCircle className="h-3 w-3 mr-2 text-green-300" />
               Suscripción OK
            </div>
          </div>
        </div>

        {/* Clinics & Users Tabs (Simplified version) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Clinics Section */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Sucursales y Clínicas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {org.clinics?.map(clinic => (
                <div key={clinic.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-primary-200 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{clinic.name}</h5>
                    <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-400" />
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p className="flex items-center"><Clock className="h-3 w-3 mr-2" /> {clinic.address || 'Sin dirección'}</p>
                    <div className="flex space-x-4 pt-2 border-t border-gray-50 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{clinic._count?.offices} Consultorios</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">{clinic._count?.appointments} Citas Totales</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Staff Section */}
          <section>
             <div className="flex items-center space-x-2 mb-4 pt-4">
              <Users className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Equipo de Trabajo</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                   <tr>
                     <th className="px-6 py-4">Nombre</th>
                     <th className="px-6 py-4">Rol</th>
                     <th className="px-6 py-4">Estado</th>
                     <th className="px-6 py-4 text-right">Contacto</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-sm">
                   {org.users?.map(user => (
                     <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 font-bold text-gray-900">{user.first_name} {user.last_name}</td>
                       <td className="px-6 py-4 text-gray-500">
                         <span className="flex items-center">
                           {user.role === 'DOCTOR' ? <Stethoscope className="h-3 w-3 mr-1.5" /> : <UserCheck className="h-3 w-3 mr-1.5" />}
                           {user.role}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.is_active ? 'Si' : 'No'}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right italic text-gray-400">{user.email}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
