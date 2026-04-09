import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { UserPlus, Star, UserCheck, Shield, Edit2, X, Check } from 'lucide-react';
import Swal from 'sweetalert2';

export default function OwnerTeam() {
  const [employees, setEmployees] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', 
    last_name: '', 
    email: '', 
    password: '', 
    role: 'DOCTOR',
    clinic_id: '', 
    office_ids: [], 
    supervisor_id: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, clinicsRes] = await Promise.all([
        api.get('/users/team'),
        api.get('/clinics')
      ]);
      setEmployees(teamRes.data.data);
      setClinics(clinicsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync offices when clinic changes
  useEffect(() => {
    if (!formData.clinic_id) {
      setOffices([]);
      return;
    }

    api.get(`/clinics/${formData.clinic_id}/offices`).then(res => {
      setOffices(res.data.data || []);
    }).catch(() => setOffices([]));
  }, [formData.clinic_id]);

  const handleOpenInvite = () => {
    setEditingUserId(null);
    setFormData({ 
      first_name: '', last_name: '', email: '', password: '', role: 'DOCTOR', 
      clinic_id: '', office_ids: [], supervisor_id: '', is_active: true
    });
    setShowForm(!showForm);
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      clinic_id: user.clinic_assignments?.[0]?.clinic_id || '',
      office_ids: user.office_assignments?.map(oa => oa.office_id) || [],
      supervisor_id: user.supervisor_id || '',
      is_active: user.is_active
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleOfficeSelection = (officeId) => {
    setFormData(prev => {
      if (prev.role === 'DOCTOR') {
        return { ...prev, office_ids: [officeId] };
      }
      const current = prev.office_ids;
      if (current.includes(officeId)) {
        return { ...prev, office_ids: current.filter(id => id !== officeId) };
      }
      return { ...prev, office_ids: [...current, officeId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clinic_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección Requerida',
        text: 'Por favor seleccione una sucursal para la asignación.',
        confirmButtonColor: '#0f172a'
      });
      return;
    }
    if (formData.office_ids.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección Requerida',
        text: 'Por favor seleccione al menos un consultorio o área de trabajo.',
        confirmButtonColor: '#0f172a'
      });
      return;
    }

    try {
      if (editingUserId) {
        await api.patch(`/users/${editingUserId}`, formData);
      } else {
        await api.post('/users/invite', {
          ...formData,
          clinics: [formData.clinic_id]
        });
      }
      
      setShowForm(false);
      setEditingUserId(null);
      await Swal.fire({
        icon: 'success',
        title: editingUserId ? 'Información Actualizada' : 'Invitación Enviada',
        text: editingUserId 
          ? 'Los cambios en el perfil del colaborador han sido guardados.' 
          : 'Se ha registrado el acceso y enviado las credenciales al correo especificado.',
        confirmButtonColor: '#0f172a',
        timer: 1500
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Gestión',
        text: error.response?.data?.message || 'No se pudo completar la operación en el sistema.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  if (loading && employees.length === 0) return <div className="p-8 text-slate-600 font-medium">Cargando personal...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Personal</h1>
           <p className="text-slate-500 mt-1">Administración de equipo y asignación de consultorios.</p>
        </div>
        <button 
          onClick={handleOpenInvite}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg flex items-center hover:bg-slate-800 transition-all font-semibold"
        >
          <UserPlus className="w-5 h-5 mr-2" /> 
          {showForm && !editingUserId ? 'Cancelar' : 'Invitar Personal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
             <h2 className="text-xl font-bold text-slate-900">
               {editingUserId ? 'Editar Información' : 'Nuevo Miembro'}
             </h2>
             {editingUserId && (
               <label className="flex items-center space-x-3 cursor-pointer">
                 <span className="text-sm font-semibold text-slate-700">Estado de la cuenta</span>
                 <div 
                   onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                   className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                 >
                   <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : ''}`} />
                 </div>
               </label>
             )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos Personales</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Nombre</label>
                  <input required className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Apellido</label>
                  <input required className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 pl-1">Email</label>
                <input required disabled={!!editingUserId} type="email" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              
              {!editingUserId && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Contraseña Temporal</label>
                  <input required type="password" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asignación Operativa</h3>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 pl-1">Rol</label>
                <select 
                  disabled={!!editingUserId} 
                  className="w-full border border-slate-200 p-2.5 rounded-lg bg-white focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value, office_ids: []})}
                >
                  <option value="DOCTOR">Médico Especialista</option>
                  <option value="RECEPTIONIST">Personal de Recepción</option>
                </select>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 pl-1">Sucursal</label>
                    <select 
                      required
                      className="w-full border border-slate-200 p-2.5 rounded-lg bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                      value={formData.clinic_id}
                      onChange={e => setFormData({...formData, clinic_id: e.target.value, office_ids: []})}
                    >
                      <option value="">Seleccione sucursal</option>
                      {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 pl-1">
                      Consultorios {formData.role === 'RECEPTIONIST' ? '(Selección múltiple)' : '(Selección única)'}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                       {offices.map(o => (
                         <button
                           key={o.id}
                           type="button"
                           onClick={() => toggleOfficeSelection(o.id)}
                           className={`p-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-between ${
                             formData.office_ids.includes(o.id) 
                             ? 'bg-slate-900 text-white border-slate-900' 
                             : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                           }`}
                         >
                           {o.name}
                           {formData.office_ids.includes(o.id) && <Check className="w-3 h-3 ml-1" />}
                         </button>
                       ))}
                       {offices.length === 0 && (
                         <div className="col-span-full py-4 text-center border-2 border-dashed border-slate-100 rounded-lg text-slate-400 text-xs font-medium">
                           {formData.clinic_id ? 'No hay consultorios registrados' : 'Seleccione una sucursal primero'}
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {formData.role === 'RECEPTIONIST' && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Supervisor Directo</label>
                  <select 
                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                    value={formData.supervisor_id}
                    onChange={e => setFormData({...formData, supervisor_id: e.target.value})}
                  >
                    <option value="">Ninguno / General</option>
                    {employees.filter(u => u.role === 'DOCTOR' && u.id !== editingUserId).map(d => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => { setShowForm(false); setEditingUserId(null); }}
              className="px-6 py-2.5 rounded-lg font-semibold text-slate-500 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button type="submit" className="bg-slate-900 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition shadow-sm">
              {editingUserId ? 'Guardar Cambios' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Asignación</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(user => {
                 const assignedClinic = user.clinic_assignments?.[0]?.clinic?.name || 'No asignada';
                 const userOffices = user.office_assignments?.map(oa => oa.office?.name).join(', ') || 'Sin consultorio';

                 return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-3 border border-slate-200">
                        {user.first_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${
                      user.role === 'DOCTOR' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {user.role === 'DOCTOR' ? 'Médico' : 'Recepción'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-700">{assignedClinic}</div>
                    <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={userOffices}>
                      {userOffices}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                       <div className={`h-1.5 w-1.5 rounded-full mr-2 ${user.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                       <span className={`text-[11px] font-bold uppercase tracking-tight ${user.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                         {user.is_active ? 'Activo' : 'Inactivo'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="p-16 text-center">
             <Shield className="h-8 w-8 text-slate-200 mx-auto mb-3" />
             <p className="text-slate-400 font-semibold tracking-tight text-sm uppercase">Sin registros de personal</p>
          </div>
        )}
      </div>
    </div>
  );
}
