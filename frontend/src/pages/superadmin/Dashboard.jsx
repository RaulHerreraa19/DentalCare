import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SuperAdminDashboard() {
  const [data, setData] = useState({ pending_clinics: [], organizations: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/superadmin/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApproveClinic = async (id) => {
    const result = await Swal.fire({
      title: '¿Confirmar Activación?',
      text: "Habilitarás este consultorio para operar en la plataforma. ¿Confirmas que has recibido el pago correspondente?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, Activar Sucursal',
      cancelButtonText: 'Pendiente'
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/superadmin/approve-clinic/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Sucursal Activada',
          text: 'El consultorio ahora puede iniciar operaciones.',
          confirmButtonColor: '#0f172a',
          timer: 1500
        });
        fetchDashboard();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error Administrativo',
          text: 'No se pudo activar la sucursal.',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary-500 h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Panel Global</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Negocios Activos</h2>
              <p className="text-2xl font-semibold text-gray-900">{data.organizations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Consultorios Pendientes Pago</h2>
              <p className="text-2xl font-semibold text-gray-900">{data.pending_clinics.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Consultorios Requiriendo Activación</h3>
          <p className="mt-1 text-sm text-gray-500">Autoriza el acceso después de confirmar su pago.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {data.pending_clinics.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No hay sucursales pendientes</div>
          ) : (
            data.pending_clinics.map(clinic => (
              <div key={clinic.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{clinic.name}</h4>
                  <p className="text-sm text-gray-500">Negocio: {clinic.organization?.name}</p>
                </div>
                <button
                  onClick={() => handleApproveClinic(clinic.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Marcar Pagado y Habilitar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
