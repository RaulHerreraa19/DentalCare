const db = require("../../config/database");
const PDFDocument = require("pdfkit");

class OwnerDashboardService {
  static async getImageBufferFromUrl(url) {
    if (!url) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      return null;
    }
  }

  static async buildPdfExport(stats, filters = {}) {
    const logoBuffer = await OwnerDashboardService.getImageBufferFromUrl(
      stats?.report_branding?.logo_url,
    );

    return await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 45 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 45, 38, { fit: [80, 80] });
        } catch (error) {
          // Ignoramos imágenes no compatibles para no romper la exportación.
        }
      }

      doc
        .fontSize(17)
        .fillColor("#0f172a")
        .text("Reporte de Ingresos - Dashboard de Administrador", 140, 45)
        .fontSize(10)
        .fillColor("#475569")
        .text(
          `Organización: ${stats?.report_branding?.organization_name || "N/A"}`,
          140,
          70,
        )
        .text(
          `Sucursal branding: ${stats?.report_branding?.clinic_name || "General"}`,
        )
        .text(
          `Periodo: ${filters.startDate || "Sin límite"} a ${filters.endDate || "Sin límite"}`,
        )
        .text(`Generado: ${new Date().toLocaleString("es-MX")}`);

      doc.moveDown(2);

      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .text("Resumen financiero", { underline: true })
        .moveDown(0.5)
        .fontSize(10)
        .fillColor("#111827")
        .text(
          `Ingresos: $${(stats?.financial?.total_income || 0).toLocaleString()}`,
        )
        .text(
          `Egresos: $${(stats?.financial?.total_expense || 0).toLocaleString()}`,
        )
        .text(
          `Balance neto: $${(stats?.financial?.net_balance || 0).toLocaleString()}`,
        )
        .moveDown(1);

      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .text("Ingresos por consultorio", { underline: true })
        .moveDown(0.5)
        .fontSize(9)
        .fillColor("#111827");

      (stats?.reports?.income_by_office || [])
        .slice(0, 18)
        .forEach((item, index) => {
          doc.text(
            `${index + 1}. ${item.office_name} (${item.clinic_name}) - $${item.total_income.toLocaleString()} | ${item.transactions_count} movimientos`,
          );
        });

      doc.moveDown(1);
      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .text("Ingresos por recepcionista", { underline: true })
        .moveDown(0.5)
        .fontSize(9)
        .fillColor("#111827");

      (stats?.reports?.income_by_receptionist || [])
        .slice(0, 18)
        .forEach((item, index) => {
          doc.text(
            `${index + 1}. ${item.cashier_name} - $${item.total_income.toLocaleString()} | ${item.transactions_count} cobros`,
          );
        });

      doc.moveDown(1);
      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .text("Tendencia diaria", { underline: true })
        .moveDown(0.5)
        .fontSize(9)
        .fillColor("#111827");

      (stats?.reports?.timeline || []).slice(-31).forEach((item) => {
        doc.text(
          `${item.label}: $${item.total_income.toLocaleString()} (${item.transactions_count} movimientos)`,
        );
      });

      doc.end();
    });
  }

  static csvCell(value) {
    const safe = String(value ?? "").replace(/"/g, '""');
    return `"${safe}"`;
  }

  static csvRows(rows = []) {
    return rows
      .map((row) =>
        row.map((cell) => OwnerDashboardService.csvCell(cell)).join(","),
      )
      .join("\n");
  }

  static buildCsvExport(stats, filters = {}) {
    const rows = [];

    rows.push(["Branding del reporte"]);
    rows.push([
      "Organización",
      stats?.report_branding?.organization_name || "N/A",
    ]);
    rows.push(["Sucursal", stats?.report_branding?.clinic_name || "Todas"]);
    rows.push(["Logo URL", stats?.report_branding?.logo_url || "Sin logo"]);
    rows.push([]);

    rows.push(["Resumen de filtros"]);
    rows.push(["Sucursal", filters.clinic_id || "Todas"]);
    rows.push(["Fecha inicio", filters.startDate || "Sin límite"]);
    rows.push(["Fecha fin", filters.endDate || "Sin límite"]);
    rows.push([]);

    rows.push(["Resumen financiero"]);
    rows.push(["Ingresos", stats?.financial?.total_income || 0]);
    rows.push(["Egresos", stats?.financial?.total_expense || 0]);
    rows.push(["Balance neto", stats?.financial?.net_balance || 0]);
    rows.push([]);

    rows.push(["Ingresos por consultorio"]);
    rows.push(["Consultorio", "Clínica", "Ingresos", "Transacciones"]);
    (stats?.reports?.income_by_office || []).forEach((item) => {
      rows.push([
        item.office_name,
        item.clinic_name,
        item.total_income,
        item.transactions_count,
      ]);
    });
    rows.push([]);

    rows.push(["Ingresos por recepcionista"]);
    rows.push(["Recepcionista", "Ingresos", "Cobros"]);
    (stats?.reports?.income_by_receptionist || []).forEach((item) => {
      rows.push([
        item.cashier_name,
        item.total_income,
        item.transactions_count,
      ]);
    });
    rows.push([]);

    rows.push(["Tendencia diaria"]);
    rows.push(["Fecha", "Ingresos", "Transacciones"]);
    (stats?.reports?.timeline || []).forEach((item) => {
      rows.push([item.label, item.total_income, item.transactions_count]);
    });

    return OwnerDashboardService.csvRows(rows);
  }

  static parseDateRange(filters = {}) {
    const { startDate, endDate } = filters;

    if (!startDate && !endDate) return null;

    const range = {};
    if (startDate) range.gte = new Date(startDate);
    if (endDate) {
      range.lte = new Date(
        endDate.includes("T") ? endDate : `${endDate}T23:59:59.999Z`,
      );
    }

    return range;
  }

  static getDayKey(dateValue) {
    const date = new Date(dateValue);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  static toMoney(value) {
    return Number(parseFloat(value || 0).toFixed(2));
  }

  static buildIncomeReport(transactions = []) {
    const incomeTransactions = transactions.filter(
      (transaction) => transaction.type === "INCOME",
    );

    const byOffice = new Map();
    const byCashier = new Map();
    const byDay = new Map();

    incomeTransactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount || 0);

      const officeId = transaction.appointment?.office?.id || "NO_OFFICE";
      const officeName =
        transaction.appointment?.office?.name ||
        "Sin consultorio (movimiento manual)";
      const officeClinicName =
        transaction.clinic?.name || "Clínica no especificada";
      const officeKey = `${officeId}:${officeClinicName}`;

      const officeCurrent = byOffice.get(officeKey) || {
        office_id: officeId,
        office_name: officeName,
        clinic_name: officeClinicName,
        total_income: 0,
        transactions_count: 0,
      };
      officeCurrent.total_income += amount;
      officeCurrent.transactions_count += 1;
      byOffice.set(officeKey, officeCurrent);

      const cashierId = transaction.user?.id || "UNKNOWN_USER";
      const cashierName = transaction.user
        ? `${transaction.user.first_name} ${transaction.user.last_name}`.trim()
        : "Usuario desconocido";

      const cashierCurrent = byCashier.get(cashierId) || {
        user_id: cashierId,
        cashier_name: cashierName,
        role: transaction.user?.role || "UNKNOWN",
        total_income: 0,
        transactions_count: 0,
      };
      cashierCurrent.total_income += amount;
      cashierCurrent.transactions_count += 1;
      byCashier.set(cashierId, cashierCurrent);

      const dayKey = OwnerDashboardService.getDayKey(transaction.created_at);
      const dayCurrent = byDay.get(dayKey) || {
        label: dayKey,
        total_income: 0,
        transactions_count: 0,
      };
      dayCurrent.total_income += amount;
      dayCurrent.transactions_count += 1;
      byDay.set(dayKey, dayCurrent);
    });

    const incomeByOffice = Array.from(byOffice.values())
      .map((item) => ({
        ...item,
        total_income: OwnerDashboardService.toMoney(item.total_income),
      }))
      .sort((a, b) => b.total_income - a.total_income);

    const incomeByCashier = Array.from(byCashier.values())
      .map((item) => ({
        ...item,
        total_income: OwnerDashboardService.toMoney(item.total_income),
      }))
      .sort((a, b) => b.total_income - a.total_income);

    const incomeByReceptionist = incomeByCashier.filter(
      (item) => item.role === "RECEPTIONIST",
    );

    const timeline = Array.from(byDay.values())
      .map((item) => ({
        ...item,
        total_income: OwnerDashboardService.toMoney(item.total_income),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const receptionistsIncome = incomeByReceptionist.reduce(
      (sum, item) => sum + item.total_income,
      0,
    );

    return {
      income_by_office: incomeByOffice,
      income_by_cashier: incomeByCashier,
      income_by_receptionist: incomeByReceptionist,
      timeline,
      summary: {
        total_income_transactions: incomeTransactions.length,
        total_income_receptionists:
          OwnerDashboardService.toMoney(receptionistsIncome),
      },
    };
  }

  static async getStats(organizationId, filters = {}) {
    const { clinic_id, startDate, endDate } = filters;

    const where = { organization_id: organizationId };
    if (clinic_id) where.clinic_id = clinic_id;

    const dateFilter = OwnerDashboardService.parseDateRange({
      startDate,
      endDate,
    });
    if (dateFilter) {
      where.start_time = dateFilter;
    }

    // Branding del reporte: usa logo de clínica (si hay filtro), o un logo de clínica disponible,
    // y si no existe, usa logo de organización.
    const [organization, selectedClinic, fallbackClinicWithLogo] =
      await Promise.all([
        db.organization.findUnique({
          where: { id: organizationId },
          select: { id: true, name: true, logo_url: true },
        }),
        clinic_id
          ? db.clinic.findFirst({
              where: { id: clinic_id, organization_id: organizationId },
              select: { id: true, name: true, logo_url: true },
            })
          : Promise.resolve(null),
        db.clinic.findFirst({
          where: { organization_id: organizationId, logo_url: { not: null } },
          select: { id: true, name: true, logo_url: true },
          orderBy: { created_at: "asc" },
        }),
      ]);

    const brandingClinic = selectedClinic || fallbackClinicWithLogo;
    const reportBranding = {
      organization_name: organization?.name || "Organización",
      clinic_name: brandingClinic?.name || null,
      logo_url: brandingClinic?.logo_url || organization?.logo_url || null,
    };

    // 1. Obtener cantidad de citas programadas, completadas, canceladas
    const appointments = await db.appointment.findMany({ where });

    const pending = appointments.filter((a) =>
      ["PENDING", "CONFIRMED"].includes(a.status),
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const cancelled = appointments.filter((a) =>
      ["CANCELLED", "NO_SHOW"].includes(a.status),
    ).length;

    // 2. Transacciones Reales (Caja)
    const cashWhere = { organization_id: organizationId };
    if (clinic_id) cashWhere.clinic_id = clinic_id;
    if (dateFilter) cashWhere.created_at = dateFilter;

    const transactions = await db.cashRegister.findMany({
      where: cashWhere,
      include: {
        clinic: { select: { id: true, name: true } },
        user: {
          select: { id: true, first_name: true, last_name: true, role: true },
        },
        appointment: {
          select: {
            office: { select: { id: true, name: true } },
          },
        },
      },
    });

    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // 3. Empleados y sucursales (totales globales del negocio o por sucursal)
    const branches = await db.clinic.count({
      where: { organization_id: organizationId },
    });
    const employees = await db.user.count({
      where: {
        organization_id: organizationId,
        role: { in: ["DOCTOR", "RECEPTIONIST"] },
      },
    });

    const reports = OwnerDashboardService.buildIncomeReport(transactions);

    return {
      appointments: {
        pending,
        completed,
        cancelled,
        total: appointments.length,
      },
      financial: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_balance: totalIncome - totalExpense,
      },
      infrastructure: {
        branches,
        employees,
      },
      report_branding: reportBranding,
      reports,
    };
  }
}

module.exports = OwnerDashboardService;
