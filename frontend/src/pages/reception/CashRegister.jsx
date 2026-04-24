import React, { useState, useEffect } from 'react';
import { 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter, 
  Search, 
  Plus, 
  Calendar,
  Building,
  User,
  XCircle,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import api from '../../lib/axios';
import Swal from 'sweetalert2';

export default function CashRegister() {
  const [history, setHistory] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    clinic_id: '',
    type: '',
    payment_method: '',
    startDate: '',
    endDate: ''
  });

  // Modal data
  const [newMovement, setNewMovement] = useState({
    clinic_id: '',
    type: 'INCOME',
    amount: '',
    description: '',
    category: 'OTHER',
    payment_method: 'CASH'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, clinicRes] = await Promise.all([
        api.get('/billing/history', { params: filters }),
        api.get('/clinics')
      ]);
      setHistory(histRes.data.data);
      setClinics(clinicRes.data.data);
    } catch (error) {
      console.error('Error fetching cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = history.reduce((acc, mov) => {
    const amount = parseFloat(mov.amount || 0);
    const signal = mov.type === 'INCOME' ? 1 : -1;

    acc.net += signal * amount;
    if (mov.payment_method === 'CASH') acc.cash += signal * amount;
    if (mov.payment_method === 'TRANSFER') acc.transfer += signal * amount;
    if (mov.payment_method === 'CARD') acc.card += signal * amount;

    return acc;
  }, { net: 0, cash: 0, transfer: 0, card: 0 });

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/movement', newMovement);
      await Swal.fire({
        icon: 'success',
        title: 'Movimiento Registrado',
        text: 'El asiento contable ha sido guardado exitosamente.',
        confirmButtonColor: '#0f172a',
        timer: 2000
      });
      fetchData();
      setShowModal(false);
      setNewMovement({
        clinic_id: '',
        type: 'INCOME',
        amount: '',
        description: '',
        category: 'OTHER',
        payment_method: 'CASH'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Caja',
        text: error.response?.data?.message || 'No se pudo registrar el movimiento financiero.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Control de Tesorería</h1>
          <p className="text-slate-500 mt-2 font-medium">Historial consolidado de movimientos financieros institucionales.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg flex items-center hover:bg-slate-800 transition-all font-semibold shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Registrar Movimiento
        </button>
      </div>

      {/* Filters Corporate Panel */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 border-r border-slate-100">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros Operativos</span>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <select 
            className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer uppercase tracking-tight"
            value={filters.clinic_id}
            onChange={(e) => setFilters({...filters, clinic_id: e.target.value})}
          >
            <option value="">Consolidado Global</option>
            {clinics?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <select 
            className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer uppercase tracking-tight"
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="">Todos los conceptos</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Egresos</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <select 
            className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer uppercase tracking-tight"
            value={filters.payment_method}
            onChange={(e) => setFilters({...filters, payment_method: e.target.value})}
          >
            <option value="">Todos los métodos</option>
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="CARD">Tarjeta/Terminal</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-1.5 rounded border border-slate-100">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="date" 
            className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0 focus:ring-0"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
          <span className="text-slate-300 text-[10px] font-black uppercase">al</span>
          <input 
            type="date" 
            className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0 focus:ring-0"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
        </div>
      </div>

      {/* Corporate Ledger Table */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Efectivo Esperado</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">${totals.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Cierre de caja en físico</p>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700">Neto Transferencia</p>
          <p className="text-2xl font-black text-cyan-900 mt-1">${totals.transfer.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-700">Neto Tarjeta/Terminal</p>
          <p className="text-2xl font-black text-violet-900 mt-1">${totals.card.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Balance Neto Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">${totals.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Sello de Tiempo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Sucursal</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Descripción del Asiento</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Método</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Monto Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm font-medium">Sincronizando flujos de caja...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm font-medium italic opacity-60 uppercase tracking-widest">Sin asientos contables en el periodo</td>
                </tr>
              ) : (
                history.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 text-xs text-slate-600 font-bold uppercase tracking-tighter">
                      {new Date(mov.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {new Date(mov.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <Building className="h-3 w-3 mr-2 opacity-50" />
                        {mov.clinic?.name}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-slate-950">{mov.description}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Autor: {mov.user?.first_name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                        {mov.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                        {mov.payment_method === 'CASH' ? 'Efectivo' : mov.payment_method === 'TRANSFER' ? 'Transferencia' : mov.payment_method === 'CARD' ? 'Tarjeta/Terminal' : 'N/A'}
                      </span>
                    </td>
                    <td className={`px-6 py-5 text-right font-black text-sm tracking-tight ${
                      mov.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {mov.type === 'INCOME' ? '+' : '-'}${parseFloat(mov.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Movement Corporate */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Nuevo Asiento Contable</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateMovement} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Unidad de Negocio *</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-1 focus:ring-slate-900 outline-none bg-white font-semibold text-slate-700"
                  value={newMovement.clinic_id}
                  onChange={(e) => setNewMovement({...newMovement, clinic_id: e.target.value})}
                >
                  <option value="">Seleccione sucursal...</option>
                  {clinics?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tipo de Flujo</label>
                  <select 
                    className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-1 focus:ring-slate-900 outline-none bg-white font-semibold text-slate-700"
                    value={newMovement.type}
                    onChange={(e) => setNewMovement({...newMovement, type: e.target.value})}
                  >
                    <option value="INCOME">Ingreso (+)</option>
                    <option value="EXPENSE">Egreso (-)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Importe</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded p-3 text-sm font-bold focus:ring-1 focus:ring-slate-900 outline-none"
                    value={newMovement.amount}
                    onChange={(e) => setNewMovement({...newMovement, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Categoría Operativa</label>
                <select 
                  className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-1 focus:ring-slate-900 outline-none bg-white font-semibold text-slate-700"
                  value={newMovement.category}
                  onChange={(e) => setNewMovement({...newMovement, category: e.target.value})}
                >
                  <option value="OTHER">Otros Conceptos</option>
                  <option value="APPOINTMENT_PAYMENT">Retribución por Consulta</option>
                  <option value="SUPPLIES">Insumos y Logística</option>
                  <option value="RENT">Arrendamientos</option>
                  <option value="SALARY">Nómina / Honorarios</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Método de Pago</label>
                <select 
                  className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-1 focus:ring-slate-900 outline-none bg-white font-semibold text-slate-700"
                  value={newMovement.payment_method}
                  onChange={(e) => setNewMovement({...newMovement, payment_method: e.target.value})}
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CARD">Tarjeta / Terminal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Glosa / Justificación</label>
                <textarea 
                  required
                  placeholder="Detalles técnicos del movimiento..."
                  className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-1 focus:ring-slate-900 outline-none min-h-[80px] font-medium resize-none shadow-inner"
                  value={newMovement.description}
                  onChange={(e) => setNewMovement({...newMovement, description: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded transition-all uppercase tracking-widest"
                >
                  Descartar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 uppercase tracking-widest"
                >
                  Registrar Asiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
