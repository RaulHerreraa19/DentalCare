import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { UserPlus, Search, User, Phone, Mail, XCircle, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      setPatients(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await Swal.fire({
        icon: 'success',
        title: 'Paciente Registrado',
        text: 'El nuevo paciente ha sido dado de alta correctamente.',
        confirmButtonColor: '#0f172a',
        timer: 2000
      });
      fetchPatients();
      setFormData({ first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: '', address: '' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Registro',
        text: error.response?.data?.message || 'No se pudo completar el registro.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Directorio de Pacientes</h1>
          <p className="text-slate-500 mt-1 font-medium">Base de datos centralizada de registros clínicos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg flex items-center hover:bg-slate-800 transition-all font-semibold shadow-sm"
        >
          <UserPlus className="w-5 h-5 mr-2" /> Nuevo Registro
        </button>
      </div>

      <div className="flex bg-white p-2 rounded-lg border border-slate-200 shadow-sm max-w-md">
        <div className="flex items-center px-3 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          className="w-full bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Paciente</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Última Actividad</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm font-medium">Sincronizando expedientes...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm font-medium italic">No se encontraron registros activos</td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold mr-3 border border-slate-200 leading-none">
                          {p.first_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{p.first_name} {p.last_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">ID: {p.id.substring(0,8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-xs font-semibold text-slate-700">
                          <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                          {p.phone}
                        </div>
                        {p.email && (
                          <div className="flex items-center text-xs text-slate-500">
                            <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                            {p.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Registro Inicial</span>
                       <p className="text-xs text-slate-700 font-medium mt-0.5">{new Date(p.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {user?.role === 'DOCTOR' ? (
                        <button 
                          onClick={() => navigate(`/doctor/medical-records/${p.id}`)}
                          className="text-[11px] font-black text-slate-900 border border-slate-200 px-3 py-1.5 rounded uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm flex items-center inline-flex"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          Expediente
                        </button>
                       ) : (
                        <button className="text-[11px] font-bold text-slate-400 border border-slate-100 px-3 py-1.5 rounded uppercase tracking-wider bg-slate-50/50 cursor-not-allowed">
                          Solo Lectura
                        </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Registro de Paciente</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nombres *</label>
                  <input required className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                    value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Apellidos *</label>
                  <input required className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                    value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Fecha de Nacimiento</label>
                  <input type="date" required className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                    value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Género</label>
                  <select required className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Teléfono (WhatsApp)</label>
                  <input required className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email</label>
                  <input type="email" className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Dirección Legal</label>
                <textarea className="w-full border border-slate-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-slate-900 outline-none min-h-[80px]" 
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded uppercase tracking-widest">Descartar</button>
                <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 uppercase tracking-widest">Dar de Alta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
