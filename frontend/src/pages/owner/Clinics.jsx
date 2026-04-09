import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Plus, Building, Lock, ChevronDown, ChevronUp, MapPin, Edit3, Image as ImageIcon, Phone, Save, X } from 'lucide-react';

export default function OwnerClinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const fetchClinics = async () => {
    try {
      const { data } = await api.get('/clinics/my');
      setClinics(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clinics', { name, address });
      setShowForm(false);
      setName('');
      setAddress('');
      fetchClinics();
    } catch (error) {
      alert('Error al crear clínica');
    }
  };

  if (loading) return <div className="p-8 text-slate-600 font-medium">Sincronizando centros...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Sucursales</h1>
          <p className="text-slate-500 mt-1 font-medium">Configuración de identidad visual y distribución operativa.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg flex items-center hover:bg-black transition-all font-semibold shadow-lg shadow-slate-200"
        >
          <Plus className="w-5 h-5 mr-2" /> Registrar Nueva Sucursal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-lg border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-6 text-slate-900 pb-4 border-b border-slate-100 flex items-center">
             <Building className="w-5 h-5 mr-3 text-slate-400" /> Datos de la Sucursal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombre Comercial</label>
              <input 
                required
                placeholder="Ej. Clínica Dental Central" 
                className="w-full border border-slate-200 p-3 rounded text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                value={name} onChange={e => setName(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Dirección Física Completa</label>
              <input 
                required
                placeholder="Calle, Número, Colonia, Ciudad" 
                className="w-full border border-slate-200 p-3 rounded text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                value={address} onChange={e => setAddress(e.target.value)} 
              />
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 flex items-center mb-4 sm:mb-0 font-bold uppercase tracking-tight">
              <Lock className="w-4 h-4 mr-2" />
              Sujeto a validación administrativa para inicio de operaciones
            </p>
            <div className="flex gap-4 w-full sm:w-auto">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition rounded uppercase tracking-widest">Descartar</button>
              <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded font-bold text-xs hover:bg-black transition shadow-lg shadow-slate-200 uppercase tracking-widest">Crear Sucursal</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {clinics.map(clinic => (
          <ClinicRow key={clinic.id} clinic={clinic} onUpdate={fetchClinics} />
        ))}
        {clinics.length === 0 && (
           <div className="p-24 text-center text-slate-400 opacity-40">
             <Building className="mx-auto h-16 w-16 mb-4" />
             <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Sin unidades operativas registradas</p>
           </div>
        )}
      </div>
    </div>
  );
}

function ClinicRow({ clinic, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: clinic.name,
    address: clinic.address,
    phone: clinic.phone || '',
    logo_url: clinic.logo_url || ''
  });

  const [showAddOffice, setShowAddOffice] = useState(false);
  const [officeName, setOfficeName] = useState('');
  const [officeFloor, setOfficeFloor] = useState('');

  const fetchOffices = async () => {
    setLoadingOffices(true);
    try {
      const res = await api.get(`/clinics/${clinic.id}/offices`);
      setOffices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOffices(false);
    }
  };

  useEffect(() => {
    if (expanded) fetchOffices();
  }, [expanded]);

  const handleUpdate = async () => {
    try {
      await api.patch(`/clinics/${clinic.id}`, editData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      alert('Error al actualizar clínica');
    }
  };

  const handleAddOffice = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/clinics/${clinic.id}/offices`, { name: officeName, floor: officeFloor });
      setOfficeName('');
      setOfficeFloor('');
      setShowAddOffice(false);
      fetchOffices();
    } catch (err) {
      alert('Error al crear consultorio');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="p-6 flex justify-between items-center group">
        <div className="flex items-center space-x-6 cursor-pointer flex-1" onClick={() => setExpanded(!expanded)}>
          <div className="w-14 h-14 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-300 overflow-hidden shadow-inner">
             {clinic.logo_url ? (
               <img src={clinic.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
             ) : (
               <Building className="w-6 h-6" />
             )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{clinic.name}</h3>
            <div className="text-[11px] font-bold text-slate-400 flex items-center mt-1 uppercase tracking-widest">
              <MapPin className="w-3 h-3 mr-2" /> {clinic.address}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className={`h-2 w-2 rounded-full ${clinic.status === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-200 shadow-md' : 'bg-slate-300'}`} title={clinic.status} />
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-slate-400">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 flex items-center">
                  <Edit3 className="w-4 h-4 mr-3" /> Configuración de Sucursal
                </h2>
                <button onClick={() => setIsEditing(false)} className="text-slate-300 hover:text-slate-900"><X className="w-6 h-6" /></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Sucursal</label>
                      <input className="w-full border border-slate-200 p-3 rounded text-sm font-bold" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección Comercial</label>
                      <input className="w-full border border-slate-200 p-3 rounded text-sm font-bold" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Atención</label>
                      <input className="w-full border border-slate-200 p-3 rounded text-sm font-bold" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo de la Clínica (URL)</label>
                       <div className="flex gap-4">
                          <input 
                            className="flex-1 border border-slate-200 p-3 rounded text-[10px] font-mono" 
                            placeholder="https://ejemplo.com/logo.png"
                            value={editData.logo_url} 
                            onChange={e => setEditData({...editData, logo_url: e.target.value})} 
                          />
                          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-300 overflow-hidden">
                             {editData.logo_url ? <img src={editData.logo_url} alt="P" className="w-full h-full object-contain p-1" /> : <ImageIcon className="w-5 h-5" />}
                          </div>
                       </div>
                       <p className="text-[9px] text-slate-400 font-bold uppercase italic">Este logo aparecerá en el encabezado de las recetas digitales generadas por esta sucursal.</p>
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsEditing(false)} className="flex-1 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                   <button onClick={handleUpdate} className="flex-1 py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-[0.2em] rounded shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center">
                     <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-8 animate-in fade-in slide-in-from-top-2">
          {/* Distribución Interna Header */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
             <div className="flex items-center space-x-3">
                <div className="bg-slate-900 p-2 rounded text-white shadow-md">
                   <Building2 className="w-3 h-3" />
                </div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Distribución Operativa (Consultorios)</h4>
             </div>
             <button 
                onClick={() => setShowAddOffice(!showAddOffice)}
                className="text-[9px] font-black text-slate-600 border border-slate-300 bg-white hover:bg-slate-900 hover:text-white px-4 py-2 rounded transition-all uppercase tracking-widest shadow-sm"
              >
                Registrar Área
              </button>
          </div>

          {showAddOffice && (
            <form onSubmit={handleAddOffice} className="mb-8 bg-white p-8 rounded border border-slate-200 shadow-xl flex flex-col md:flex-row gap-6 items-end animate-in zoom-in-95 duration-200">
               <div className="flex-1 w-full space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificador de Área *</label>
                 <input required className="w-full border border-slate-200 rounded p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-slate-900" placeholder="Ej. Unidad 1 / Box A" value={officeName} onChange={e => setOfficeName(e.target.value)} />
               </div>
               <div className="flex-1 w-full space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nivel o Referencia</label>
                 <input className="w-full border border-slate-200 rounded p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-slate-900" placeholder="Ej. Primer Piso / Ala Norte" value={officeFloor} onChange={e => setOfficeFloor(e.target.value)} />
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                 <button type="button" onClick={() => setShowAddOffice(false)} className="px-6 py-3 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Ocultar</button>
                 <button type="submit" className="bg-slate-900 text-white font-black text-[10px] px-8 py-3 rounded hover:bg-black uppercase tracking-widest shadow-lg shadow-slate-200">Confirmar</button>
               </div>
            </form>
          )}

          {loadingOffices ? (
            <div className="py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Sincronizando infraestructura...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {offices.map(office => (
                <div key={office.id} className="bg-white border border-slate-200 p-6 rounded shadow-sm hover:shadow-xl hover:border-slate-900 transition-all group relative">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-slate-900 group-hover:text-black transition-all text-sm">{office.name}</h5>
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                  </div>
                  {office.floor && <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{office.floor}</p>}
                </div>
              ))}
              {offices.length === 0 && !showAddOffice && (
                <div className="col-span-full py-16 text-center bg-slate-100/50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">Sin consultorios configurados en esta unidad</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
