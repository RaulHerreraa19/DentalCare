import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import Swal from 'sweetalert2';
import {
  FileText,
  Users,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Eye,
  Edit,
  ArrowRight,
  Filter,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function MedicalRecordsFollowup() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medical-records');
      if (response.data.data && Array.isArray(response.data.data)) {
        setRecords(response.data.data);
        // Load patient info for each record
        await loadPatientInfo(response.data.data);
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al cargar expedientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientInfo = async (records) => {
    const patientIds = [...new Set(records.map(r => r.patient_id))];
    const patientsMap = {};
    
    for (const patientId of patientIds) {
      try {
        const res = await api.get(`/patients/${patientId}`);
        patientsMap[patientId] = res.data.data;
      } catch (error) {
        patientsMap[patientId] = { first_name: 'Desconocido', last_name: '' };
      }
    }
    
    setPatients(patientsMap);
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      CLOSED: 'Cerrado',
      ARCHIVED: 'Archivado'
    };
    return labels[status] || status;
  };

  const filteredRecords = records
    .filter(record => {
      const patient = patients[record.patient_id];
      const searchLower = searchTerm.toLowerCase();
      const matches = !searchTerm || 
        (patient?.first_name || '').toLowerCase().includes(searchLower) ||
        (patient?.last_name || '').toLowerCase().includes(searchLower) ||
        (patient?.phone || '').includes(searchTerm);
      
      const statusMatch = filterStatus === 'all' || record.status === filterStatus;
      return matches && statusMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updated_at) - new Date(a.updated_at);
      } else if (sortBy === 'patient') {
        const patientA = patients[a.patient_id];
        const patientB = patients[b.patient_id];
        return `${patientA?.first_name} ${patientA?.last_name}`.localeCompare(
          `${patientB?.first_name} ${patientB?.last_name}`
        );
      } else if (sortBy === 'version') {
        return b.current_version - a.current_version;
      }
      return 0;
    });

  const stats = {
    total: records.length,
    draft: records.filter(r => r.status === 'DRAFT').length,
    active: records.filter(r => r.status === 'ACTIVE').length,
    closed: records.filter(r => r.status === 'CLOSED').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <p>Cargando expedientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Seguimiento de Expedientes</h1>
                <p className="text-sm text-slate-600">Gestiona todos los expedientes clínicos</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Nuevo Expediente
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <Users size={32} className="text-slate-300" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Borradores</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.draft}</p>
              </div>
              <FileText size={32} className="text-yellow-300" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Activos</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.active}</p>
              </div>
              <TrendingUp size={32} className="text-blue-300" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Cerrados</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.closed}</p>
              </div>
              <AlertCircle size={32} className="text-green-300" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por paciente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="DRAFT">Borradores</option>
                <option value="ACTIVE">Activos</option>
                <option value="CLOSED">Cerrados</option>
                <option value="ARCHIVED">Archivados</option>
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="updated">Más recientes</option>
                <option value="patient">Paciente (A-Z)</option>
                <option value="version">Versiones (Mayor a Menor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600">No se encontraron expedientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Versión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Última Actualización</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((record) => {
                    const patient = patients[record.patient_id];
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {patient?.first_name} {patient?.last_name}
                            </p>
                            <p className="text-sm text-slate-500">{record.patient_id.substring(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {patient?.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          v{record.current_version}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(record.updated_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/doctor/expedient/${record.patient_id}`)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                              title="Editar expediente"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                            <button
                              onClick={() => navigate(`/doctor/expedient/${record.patient_id}?view=true`)}
                              className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Mostrando {filteredRecords.length} de {records.length} expedientes</p>
        </div>
      </div>
    </div>
  );
}
