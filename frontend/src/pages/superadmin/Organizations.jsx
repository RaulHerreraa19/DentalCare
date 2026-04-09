import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Search, Shield, ArrowUpRight } from 'lucide-react';
import api from '../../lib/axios';

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Cargando negocios...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Negocios</h1>
          <p className="text-gray-500">Administra todas las clínicas y organizaciones en la plataforma.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Negocio
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o identificador..." 
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Organizations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => (
          <div key={org.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-50 rounded-xl">
                  <Building className="h-6 w-6 text-primary-600" />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  org.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' : 
                  org.plan === 'PREMIUM' ? 'bg-primary-100 text-primary-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  Plan {org.plan}
                </span>
              </div>
              
              <h2 className="text-lg font-bold text-gray-900 mb-1">{org.name}</h2>
              <p className="text-sm text-gray-500 mb-4">@{org.slug}</p>
              
              <div className="flex items-center text-sm text-gray-600 space-x-6 mb-6">
                <div>
                  <span className="block font-bold text-gray-900">{org._count?.clinics || 0}</span>
                  <span className="text-xs uppercase text-gray-400">Sucursales</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-900">{org._count?.users || 0}</span>
                  <span className="text-xs uppercase text-gray-400">Usuarios</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center">
                   <div className={`h-2 w-2 rounded-full mr-2 ${org.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <span className="text-xs font-medium text-gray-600">{org.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
                <Link 
                  to={`/superadmin/organizations/${org.id}`}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filteredOrgs.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Building className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No se encontraron negocios con esos criterios.</p>
          </div>
        )}
      </div>
    </div>
  );
}
