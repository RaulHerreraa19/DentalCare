const db = require('../../config/database');

class OwnerDashboardService {
  static async getStats(organizationId, filters = {}) {
    const { clinic_id, startDate, endDate } = filters;

    const where = { organization_id: organizationId };
    if (clinic_id) where.clinic_id = clinic_id;

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate.includes('T') ? endDate : endDate + 'T23:59:59.999Z');
      where.start_time = dateFilter; // For appointments
    }

    // 1. Obtener cantidad de citas programadas, completadas, canceladas
    const appointments = await db.appointment.findMany({ where });

    const pending = appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length;

    // 2. Transacciones Reales (Caja)
    const cashWhere = { organization_id: organizationId };
    if (clinic_id) cashWhere.clinic_id = clinic_id;
    if (startDate || endDate) cashWhere.created_at = dateFilter;

    const transactions = await db.cashRegister.findMany({ where: cashWhere });

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // 3. Empleados y sucursales (totales globales del negocio o por sucursal)
    const branches = await db.clinic.count({ where: { organization_id: organizationId }});
    const employees = await db.user.count({ 
      where: { 
        organization_id: organizationId, 
        role: { in: ['DOCTOR', 'RECEPTIONIST'] } 
      } 
    });

    return {
      appointments: {
        pending,
        completed,
        cancelled,
        total: appointments.length
      },
      financial: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_balance: totalIncome - totalExpense
      },
      infrastructure: {
        branches,
        employees
      }
    };
  }
}

module.exports = OwnerDashboardService;
