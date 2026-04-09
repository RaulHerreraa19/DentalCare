import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Plus, Settings, Trash2, ListChecks, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DoctorServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/services');
      setServices(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', { name, price: parseFloat(price) });
      setName('');
      setPrice('');
      Swal.fire({
        icon: 'success',
        title: 'Servicio Registrado',
        text: 'El nuevo concepto ha sido añadido a tu catálogo profesional.',
        confirmButtonColor: '#0f172a',
        timer: 1500
      });
      fetchServices();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo registrar el servicio en este momento.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: "Esta acción retirará el concepto de tu catálogo profesional.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/services/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El servicio ha sido removido exitosamente.',
          confirmButtonColor: '#0f172a',
          timer: 1500
        });
        fetchServices();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el servicio.',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  if (loading && services.length === 0) return <div className="p-8 text-slate-600 font-medium italic text-center">Cargando catálogo profesional...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-uppercase">Portafolio de Servicios</h1>
        <p className="text-slate-500 mt-2 font-medium">Gestión de tratamientos, honorarios y oferta médica personalizada.</p>
      </div>

      <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Plus className="w-4 h-4 text-slate-900" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Registrar Nuevo Concepto</h2>
        </div>
        
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Descripción del Servicio</label>
            <input 
              required 
              placeholder="Ej. Diagnóstico Clínico General"
              className="w-full border border-slate-200 p-3 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none bg-white font-semibold text-slate-700" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div className="w-full md:w-56 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Honorario Bruto ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">$</span>
              </div>
              <input 
                required 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                className="w-full border border-slate-200 p-3 pl-8 rounded-lg text-sm font-bold focus:ring-1 focus:ring-slate-900 outline-none bg-white" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
              />
            </div>
          </div>
          <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 w-full md:w-auto">
            Añadir al Catálogo
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
           <div className="flex items-center space-x-2">
             <ListChecks className="w-4 h-4 text-slate-500" />
             <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Activos en el Catálogo</h3>
           </div>
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{services.length} Conceptos Registrados</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle del Servicio</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Honorario</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic font-medium">
              {services.map(service => (
                <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-slate-950 uppercase tracking-tight">{service.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {service.id.substring(0,8).toUpperCase()}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center text-sm font-black text-slate-900">
                      <DollarSign className="w-3 h-3 mr-1 text-slate-400" />
                      {parseFloat(service.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDelete(service.id)} 
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                      title="Eliminar del catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {services.length === 0 && (
          <div className="p-20 text-center opacity-40">
            <Settings className="mx-auto h-12 w-12 mb-4 text-slate-200 animate-spin-slow" />
            <p className="font-bold uppercase tracking-widest text-[11px] text-slate-400 italic">No se han definido conceptos de facturación</p>
          </div>
        )}
      </div>
    </div>
  );
}
