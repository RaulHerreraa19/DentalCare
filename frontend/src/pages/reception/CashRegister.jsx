import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building,
  Calendar,
  Filter,
  FileText,
  History,
  Plus,
  Search,
  User,
} from 'lucide-react';
import api from '../../lib/axios';
import Swal from 'sweetalert2';
import { LoadingScreen } from '../../components/ui';
import {
  Button,
  Card,
  DataTable,
  DashboardSectionLayout,
  EmptyState,
  Input,
  KPIStatCard,
  Modal,
  SelectControl,
} from '../../components/ui';

const movementTypeOptions = [
  { value: '', label: 'Todos los conceptos' },
  { value: 'INCOME', label: 'Ingresos' },
  { value: 'EXPENSE', label: 'Egresos' },
];

const paymentMethodOptions = [
  { value: '', label: 'Todos los métodos' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta/Terminal' },
];

const movementCategoryOptions = [
  { value: 'OTHER', label: 'Otros conceptos' },
  { value: 'APPOINTMENT_PAYMENT', label: 'Retribución por consulta' },
  { value: 'SUPPLIES', label: 'Insumos y logística' },
  { value: 'RENT', label: 'Arrendamientos' },
  { value: 'SALARY', label: 'Nómina / Honorarios' },
];

const movementDirectionOptions = [
  { value: 'INCOME', label: 'Ingreso (+)' },
  { value: 'EXPENSE', label: 'Egreso (-)' },
];

const paymentMethodLabelMap = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta/Terminal',
};

const categoryLabelMap = {
  OTHER: 'Otros conceptos',
  APPOINTMENT_PAYMENT: 'Retribución por consulta',
  SUPPLIES: 'Insumos y logística',
  RENT: 'Arrendamientos',
  SALARY: 'Nómina / Honorarios',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

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

  const selectedClinicLabel = useMemo(() => {
    if (!filters.clinic_id) return 'Consolidado global';
    return clinics.find((clinic) => clinic.id === filters.clinic_id)?.name || 'Sucursal seleccionada';
  }, [clinics, filters.clinic_id]);

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

  if (loading) {
    return <LoadingScreen title="Cargando caja" description="Sincronizando movimientos y saldos" />;
  }

  return (
    <DashboardSectionLayout
      eyebrow="Recepción"
      title="Control de Tesorería"
      description="Historial consolidado de movimientos financieros institucionales."
      actions={(
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-5 w-5" />
          Registrar movimiento
        </Button>
      )}
      containerClassName="mx-auto max-w-7xl px-layout py-layout space-y-section animate-in fade-in duration-500"
    >
      <Card className="p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_1.1fr]">
          <div className="space-y-2 lg:pr-4 lg:border-r lg:border-border">
            <p className="text-label text-muted">Filtros operativos</p>
            <p className="text-body text-muted">{selectedClinicLabel}</p>
          </div>

          <SelectControl
            label="Sucursal"
            value={filters.clinic_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, clinic_id: e.target.value }))}
            options={[
              { value: '', label: 'Consolidado global' },
              ...(clinics?.map((clinic) => ({ value: clinic.id, label: clinic.name })) || []),
            ]}
            prefix={<Building className="h-4 w-4" />}
          />

          <SelectControl
            label="Concepto"
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            options={movementTypeOptions}
            prefix={<FileText className="h-4 w-4" />}
          />

          <SelectControl
            label="Método de pago"
            value={filters.payment_method}
            onChange={(e) => setFilters((prev) => ({ ...prev, payment_method: e.target.value }))}
            options={paymentMethodOptions}
            prefix={<User className="h-4 w-4" />}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-4">
            <Input
              label="Desde"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              prefix={<Calendar className="h-4 w-4" />}
            />
            <Input
              label="Hasta"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              prefix={<Calendar className="h-4 w-4" />}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPIStatCard
          title="Efectivo esperado"
          value={`$${formatCurrency(totals.cash)}`}
          tone="success"
          badge="Cierre físico"
          icon={ArrowUpCircle}
          footer="Cierre de caja en físico"
        />
        <KPIStatCard
          title="Neto transferencia"
          value={`$${formatCurrency(totals.transfer)}`}
          tone="accent"
          badge="Transferencias"
          icon={ArrowUpCircle}
          footer="Flujo bancario"
        />
        <KPIStatCard
          title="Neto tarjeta/terminal"
          value={`$${formatCurrency(totals.card)}`}
          tone="primary"
          badge="Terminal"
          icon={ArrowUpCircle}
          footer="Cobro electrónico"
        />
        <KPIStatCard
          title="Balance neto total"
          value={`$${formatCurrency(totals.net)}`}
          tone="danger"
          badge="Resultado"
          icon={ArrowDownCircle}
          footer="Consolidado del periodo"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={history.length === 0}
        emptyState={(
          <EmptyState
            icon={History}
            title="Sin asientos contables en el periodo"
            description="Ajusta los filtros para revisar otro rango o sucursal."
          />
        )}
      >
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Sello de tiempo
              </th>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Sucursal
              </th>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Descripción del asiento
              </th>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Categoría
              </th>
              <th scope="col" className="px-6 py-4 text-left text-caption uppercase tracking-[0.14em] text-muted">
                Método
              </th>
              <th scope="col" className="px-6 py-4 text-right text-caption uppercase tracking-[0.14em] text-muted">
                Monto neto
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {history.map((movement) => {
              const { date, time } = formatDateTime(movement.created_at);
              return (
                <tr key={movement.id} className="hover:bg-surface-muted/60 transition-colors">
                  <td className="px-6 py-4 align-top text-sm">
                    <p className="font-medium text-ink">{date}</p>
                    <p className="text-caption text-muted">{time}</p>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-ink">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted" />
                      <span>{movement.clinic?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-ink">{movement.description}</p>
                      <p className="text-caption text-muted">Autor: {movement.user?.first_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex rounded-control border border-border bg-surface-muted px-2.5 py-1 text-caption uppercase tracking-[0.14em] text-muted">
                      {categoryLabelMap[movement.category] || movement.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex rounded-control border border-border bg-surface-muted px-2.5 py-1 text-caption uppercase tracking-[0.14em] text-muted">
                      {paymentMethodLabelMap[movement.payment_method] || 'N/A'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 align-top text-right text-sm font-semibold ${movement.type === 'INCOME' ? 'text-success-600' : 'text-danger-600'}`}>
                    {movement.type === 'INCOME' ? '+' : '-'}${formatCurrency(movement.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTable>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo Asiento Contable"
        description="Registra un movimiento de caja con clasificación operativa y método de pago."
        size="lg"
        footer={(
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Descartar
            </Button>
            <Button type="submit" form="cash-register-form">
              Registrar asiento
            </Button>
          </div>
        )}
      >
        <form id="cash-register-form" onSubmit={handleCreateMovement} className="space-y-section">
          <SelectControl
            label="Unidad de negocio"
            required
            value={newMovement.clinic_id}
            onChange={(e) => setNewMovement({ ...newMovement, clinic_id: e.target.value })}
            options={[
              { value: '', label: 'Seleccione sucursal...' },
              ...(clinics?.map((clinic) => ({ value: clinic.id, label: clinic.name })) || []),
            ]}
            prefix={<Building className="h-4 w-4" />}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectControl
              label="Tipo de flujo"
              value={newMovement.type}
              onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
              options={movementDirectionOptions}
            />
            <Input
              label="Importe"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={newMovement.amount}
              onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })}
            />
          </div>

          <SelectControl
            label="Categoría operativa"
            value={newMovement.category}
            onChange={(e) => setNewMovement({ ...newMovement, category: e.target.value })}
            options={movementCategoryOptions}
          />

          <SelectControl
            label="Método de pago"
            value={newMovement.payment_method}
            onChange={(e) => setNewMovement({ ...newMovement, payment_method: e.target.value })}
            options={paymentMethodOptions.filter((option) => option.value)}
          />

          <Input
            label="Glosa / justificación"
            multiline
            rows={4}
            required
            placeholder="Detalles técnicos del movimiento..."
            value={newMovement.description}
            onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
          />
        </form>
      </Modal>
    </DashboardSectionLayout>
  );
}
