import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { 
  Save, 
  Trash2, 
  Upload, 
  Activity, 
  ShieldCheck, 
  BadgeCheck, 
  Stethoscope,
  Building2,
  Trash,
  CheckCircle2,
  Camera
} from 'lucide-react';
import api from '../../lib/axios';

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    license_number: '',
    specialty: '',
    signature_stamp_url: '',
    role: ''
  });

  const sigCanvas = useRef({});
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchClinics();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const { data } = await api.get('/clinics/my');
      setClinics(data.data);
      if (data.data.length > 0) setSelectedClinic(data.data[0]);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.patch('/users/me', profile);
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      alert('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = async () => {
    try {
      if (sigCanvas.current.isEmpty()) {
        alert('Por favor dibuja tu firma primero');
        return;
      }
      
      setSaving(true);
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      
      const { data } = await api.post('/uploads/signature', { base64: dataURL });
      
      // Actualizar perfil con la nueva URL de firma
      await api.patch('/users/me', { signature_stamp_url: data.data.url });
      
      setProfile(prev => ({ ...prev, signature_stamp_url: data.data.url }));
      alert('Firma guardada correctamente en el servidor');
    } catch (error) {
      alert('Error crítico al subir firma a Azure: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const uploadClinicLogo = async (e, clinicId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      setSaving(true);
      const { data } = await api.post('/uploads/logo', formData);
      
      // Actualizar clínica
      await api.patch(`/clinics/${clinicId}`, { logo_url: data.data.url });
      
      fetchClinics();
      alert('Logo actualizado correctamente');
    } catch (error) {
      alert('Error al subir logo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-slate-400 font-black uppercase text-xs animate-pulse">Cargando Utilerías...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Utilerías de Identidad</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" /> 
            Configuración de credenciales médicas y branding institucional
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Lado Izquierdo: Datos Profesionales (8/12) */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
           
           {/* 1. Datos del Médico */}
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-8">
                 <div className="bg-slate-900 p-2 rounded-xl text-white"><Stethoscope className="w-5 h-5" /></div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Credenciales del Miembro</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre(s)</label>
                    <input className="w-full border border-slate-100 bg-slate-50 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Apellidos</label>
                    <input className="w-full border border-slate-100 bg-slate-50 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Cédula Profesional *</label>
                    <input className="w-full border border-emerald-100 bg-emerald-50/30 p-3 rounded-xl text-sm font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none" value={profile.license_number || ''} onChange={e => setProfile({...profile, license_number: e.target.value})} placeholder="Ej: 12345678" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Especialidad</label>
                    <input className="w-full border border-slate-100 bg-slate-50 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" value={profile.specialty || ''} onChange={e => setProfile({...profile, specialty: e.target.value})} placeholder="Ej: Cirujano Dentista" />
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                 <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center"
                 >
                   {saving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                   Sincronizar Datos
                 </button>
              </div>
           </div>

           {/* 2. Panel de Firma Electrónica */}
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center space-x-3">
                    <div className="bg-emerald-500 p-2 rounded-xl text-white"><BadgeCheck className="w-5 h-5" /></div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Panel de Firma Autógrafa</h2>
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 italic">Manten presion el mouse para dibujar</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <div className="border-4 border-dashed border-slate-100 rounded-3xl bg-slate-50/30 overflow-hidden relative group">
                       <SignatureCanvas 
                        ref={sigCanvas}
                        penColor='#0f172a'
                        canvasProps={{ className: 'sigCanvas w-full min-h-[220px]' }}
                       />
                       <button 
                        onClick={clearSignature}
                        className="absolute right-4 top-4 p-2 bg-white/80 hover:bg-white text-rose-500 rounded-full shadow-lg transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <button 
                      onClick={saveSignature}
                      disabled={saving}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-50"
                    >
                      {saving ? 'Subiendo a Azure...' : 'Confirmar y Guardar Firma'}
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[220px] flex flex-col items-center justify-center text-center">
                       {profile.signature_stamp_url ? (
                         <>
                           <img src={profile.signature_stamp_url} className="max-h-32 object-contain filter invert opacity-80" alt="Firma Guardada" />
                           <p className="text-[10px] font-black text-emerald-600 mt-4 uppercase tracking-widest flex items-center">
                             <CheckCircle2 className="w-4 h-4 mr-2" /> Firma en Producción
                           </p>
                         </>
                       ) : (
                         <>
                           <Activity className="w-10 h-10 text-slate-200 mb-4" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8">No se ha registrado ninguna firma para las recetas digitales.</p>
                         </>
                       )}
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                       <p className="text-[9px] font-medium text-amber-700 leading-relaxed italic">
                         **AVISO LEGAL:** La firma aquí guardada se aplicará automáticamente a todas las recetas digitales como marca de certificación según la NOM-004.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Lado Derecho: Logos de Clínicas (4/12) */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
           
           {profile.role === 'OWNER' ? (
             <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center space-x-3 mb-8">
                   <div className="bg-white/10 p-2 rounded-xl text-white"><Building2 className="w-5 h-5" /></div>
                   <h2 className="text-xs font-black uppercase tracking-widest">Identidad de Sucursales</h2>
                </div>
                
                <div className="space-y-6">
                   {clinics.map(clinic => (
                     <div key={clinic.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl group transition-all hover:bg-white/10">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-xs font-black uppercase tracking-tight truncate pr-4">{clinic.name}</h3>
                           <div className="relative overflow-hidden cursor-pointer">
                             <label className="cursor-pointer">
                                <span className="bg-emerald-500 hover:bg-emerald-400 p-2 rounded-lg inline-block transition-all shadow-lg shadow-emerald-500/20">
                                   <Camera className="w-3 h-3" />
                                </span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadClinicLogo(e, clinic.id)} />
                             </label>
                           </div>
                        </div>
                        
                        <div className="w-full h-32 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 shadow-inner overflow-hidden">
                           {clinic.logo_url ? (
                             <img src={clinic.logo_url} className="max-h-24 object-contain" alt="Logo" />
                           ) : (
                             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Sin Logo Cargado</p>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="mt-8 text-center text-[9px] font-bold text-white/40 uppercase italic px-4 leading-relaxed">
                  Los logos aquí cargados se usarán en el encabezado de las recetas impresas en cada unidad respectiva.
                </div>
             </div>
           ) : (
             <div className="bg-slate-100 rounded-3xl p-10 text-center border-2 border-dashed border-slate-200">
                <Lock className="w-12 h-12 text-slate-300 mx-auto mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                   La gestión de logotipos de sucursales solo está disponible para los administradores de la organización.
                </p>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}

const X = ({ className }) => <Trash className={`${className}`} />; 
const Lock = ({ className }) => <Trash2 className={`${className}`} />; 
