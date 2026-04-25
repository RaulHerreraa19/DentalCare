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

  static formatMoney(value) {
    return `$${Number(value || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  static formatDateTime(dateValue) {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateValue));
  }

  static drawSectionHeader(doc, title, subtitle = null, y = null) {
    const startY = y ?? doc.y;
    doc
      .save()
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(title, 45, startY);

    if (subtitle) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(subtitle, 45, startY + 16);
    }

    doc
      .moveTo(45, startY + (subtitle ? 34 : 22))
      .lineTo(550, startY + (subtitle ? 34 : 22))
      .lineWidth(1)
      .strokeColor('#e2e8f0')
      .stroke()
      .restore();

    doc.y = startY + (subtitle ? 44 : 32);
  }

  static drawMetricCard(doc, { x, y, width, label, value, accent, note = null }) {
    const height = 72;
    doc
      .save()
      .roundedRect(x, y, width, height, 10)
      .fillAndStroke('#ffffff', '#e2e8f0');

    doc
      .roundedRect(x, y, 5, height, 10)
      .fill(accent);

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#64748b')
      .text(label.toUpperCase(), x + 16, y + 14, { width: width - 24 });

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#0f172a')
      .text(value, x + 16, y + 30, { width: width - 24 });

    if (note) {
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#94a3b8')
        .text(note, x + 16, y + 54, { width: width - 24 });
    }

    doc.restore();
  }

  static drawBarChart(doc, { x, y, width, height, title, subtitle, data, barColor = '#0f172a', labelColor = '#334155' }) {
    const chartHeight = height - 48;
    const chartTop = y + 32;
    const chartLeft = x + 8;
    const chartWidth = width - 16;
    const safeData = (data || []).filter((item) => Number(item.value || 0) > 0).slice(0, 6);
    const maxValue = Math.max(...safeData.map((item) => Number(item.value || 0)), 1);
    const rowHeight = safeData.length > 0 ? chartHeight / safeData.length : chartHeight;

    doc
      .save()
      .roundedRect(x, y, width, height, 12)
      .fillAndStroke('#ffffff', '#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text(title, x + 14, y + 12);

    if (subtitle) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(subtitle, x + 14, y + 26);
    }

    if (safeData.length === 0) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#94a3b8')
        .text('Sin datos para el periodo seleccionado.', x + 14, chartTop + 20);
      doc.restore();
      return;
    }

    safeData.forEach((item, index) => {
      const rowY = chartTop + index * rowHeight + 4;
      const labelWidth = Math.min(150, chartWidth * 0.42);
      const barX = chartLeft + labelWidth + 12;
      const barWidth = chartWidth - labelWidth - 92;
      const barHeight = Math.max(10, rowHeight - 14);
      const value = Number(item.value || 0);
      const barLength = Math.max(8, (value / maxValue) * barWidth);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(labelColor)
        .text(item.label, chartLeft, rowY, { width: labelWidth, ellipsis: true });

      doc
        .roundedRect(barX, rowY + 1, barWidth, barHeight, 6)
        .fill('#e2e8f0');

      doc
        .roundedRect(barX, rowY + 1, barLength, barHeight, 6)
        .fill(barColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#0f172a')
        .text(item.amountLabel || OwnerDashboardService.formatMoney(value), barX + barWidth + 8, rowY, {
          width: 72,
          align: 'right',
        });
    });

    doc.restore();
  }

  static drawLineChart(doc, { x, y, width, height, title, subtitle, data, strokeColor = '#0f172a', fillColor = '#cbd5e1' }) {
    const safeData = (data || []).filter((item) => Number(item.value || 0) >= 0).slice(-14);
    const maxValue = Math.max(...safeData.map((item) => Number(item.value || 0)), 1);
    const chartX = x + 12;
    const chartY = y + 34;
    const chartWidth = width - 24;
    const chartHeight = height - 52;

    doc
      .save()
      .roundedRect(x, y, width, height, 12)
      .fillAndStroke('#ffffff', '#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text(title, x + 14, y + 12);

    if (subtitle) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(subtitle, x + 14, y + 26);
    }

    if (safeData.length === 0) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#94a3b8')
        .text('Sin datos para el periodo seleccionado.', x + 14, chartY + 20);
      doc.restore();
      return;
    }

    const points = safeData.map((item, index) => {
      const px = chartX + (index * chartWidth) / Math.max(safeData.length - 1, 1);
      const py = chartY + chartHeight - (Number(item.value || 0) / maxValue) * (chartHeight - 8);
      return { x: px, y: py, item };
    });

    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(chartX, chartY + chartHeight)
      .lineTo(chartX + chartWidth, chartY + chartHeight)
      .stroke();

    for (let i = 0; i < 4; i += 1) {
      const guideY = chartY + (chartHeight * i) / 3;
      doc
        .strokeColor('#f1f5f9')
        .moveTo(chartX, guideY)
        .lineTo(chartX + chartWidth, guideY)
        .stroke();
    }

    doc
      .strokeColor(strokeColor)
      .lineWidth(2.5);

    points.forEach((point, index) => {
      if (index === 0) {
        doc.moveTo(point.x, point.y);
      } else {
        doc.lineTo(point.x, point.y);
      }
    });
    doc.stroke();

    points.forEach((point) => {
      doc
        .circle(point.x, point.y, 2.8)
        .fillAndStroke(strokeColor, '#ffffff');
    });

    points.forEach((point, index) => {
      const label = point.item.label.slice(5);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#64748b')
        .text(label, point.x - 18, chartY + chartHeight + 6, {
          width: 36,
          align: 'center',
        });

      if (index === points.length - 1) {
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor('#0f172a')
          .text(OwnerDashboardService.formatMoney(point.item.value), point.x - 26, point.y - 16, {
            width: 52,
            align: 'center',
          });
      }
    });

    doc.restore();
  }

  static async buildPdfExport(stats, filters = {}) {
    const logoBuffer = await OwnerDashboardService.getImageBufferFromUrl(
      stats?.report_branding?.logo_url,
    );
    const theme = {
      navy: '#0f172a',
      slate: '#334155',
      muted: '#64748b',
      border: '#dbe4ee',
      surface: '#ffffff',
      background: '#f6f8fb',
      accent: '#1d4ed8',
      success: '#15803d',
      danger: '#b91c1c',
    };

    return await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const addFooter = () => {
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i += 1) {
          doc.switchToPage(range.start + i);
          doc
            .font("Helvetica")
            .fontSize(7)
            .fillColor("#94a3b8")
            .text(
              `Página ${i + 1} de ${range.count}`,
              40,
              doc.page.height - 32,
              { width: doc.page.width - 80, align: "right" },
            );
        }
      };

      doc.on('pageAdded', () => {
        doc
          .save()
          .fillColor(theme.background)
          .rect(0, 0, doc.page.width, doc.page.height)
          .fill()
          .restore();
      });

      doc.rect(0, 0, doc.page.width, doc.page.height).fill(theme.background);

      // Encabezado ejecutivo
      doc.save();
      doc.roundedRect(40, 34, 515, 122, 16).fill(theme.surface);
      doc.roundedRect(40, 34, 515, 122, 16).stroke(theme.border);
      doc.roundedRect(40, 34, 10, 122, 16).fill(theme.navy);

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(theme.accent)
        .text('INFORME CONFIDENCIAL', 468, 48, { width: 70, align: 'right' });

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 58, 56, { fit: [64, 64] });
        } catch (error) {
          // Si la imagen no puede renderizarse, continuamos sin romper el PDF.
        }
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(17)
        .fillColor(theme.navy)
        .text('Reporte Ejecutivo de Ingresos', 145, 56);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(theme.muted)
        .text('Dashboard de administración y control de caja', 145, 80);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(theme.slate)
        .text(`Organización: ${stats?.report_branding?.organization_name || 'N/A'}`, 145, 98);
      doc.text(`Sucursal: ${stats?.report_branding?.clinic_name || 'General'}`, 145, 110);
      doc.text(`Periodo: ${filters.startDate || 'Sin límite'} a ${filters.endDate || 'Sin límite'}`, 145, 122);
      doc.text(`Generado: ${OwnerDashboardService.formatDateTime(new Date())}`, 402, 98, { width: 128, align: 'right' });
      doc.text(`Branding: ${stats?.report_branding?.clinic_name || 'N/A'}`, 402, 110, { width: 128, align: 'right' });

      doc.restore();

      const topY = 172;
      const cardW = 165;
      const cardGap = 10;
      const kpis = [
        {
          label: 'Ingresos Totales',
          value: OwnerDashboardService.formatMoney(stats?.financial?.total_income || 0),
          accent: theme.success,
          note: 'Ingreso bruto del periodo',
        },
        {
          label: 'Egresos Totales',
          value: OwnerDashboardService.formatMoney(stats?.financial?.total_expense || 0),
          accent: theme.danger,
          note: 'Salidas registradas en caja',
        },
        {
          label: 'Balance Neto',
          value: OwnerDashboardService.formatMoney(stats?.financial?.net_balance || 0),
          accent: (stats?.financial?.net_balance || 0) >= 0 ? theme.navy : '#be123c',
          note: 'Resultado consolidado',
        },
      ];

      kpis.forEach((item, index) => {
        OwnerDashboardService.drawMetricCard(doc, {
          x: 40 + index * (cardW + cardGap),
          y: topY,
          width: cardW,
          label: item.label,
          value: item.value,
          accent: item.accent,
          note: item.note,
        });
      });

      const kpi2Y = topY + 86;
      const secondaryCards = [
        {
          label: 'Citas Finalizadas',
          value: String(stats?.appointments?.completed || 0),
          accent: theme.accent,
          note: 'Consultas atendidas',
        },
        {
          label: 'Sucursales',
          value: String(stats?.infrastructure?.branches || 0),
          accent: '#5b21b6',
          note: 'Unidades operativas',
        },
        {
          label: 'Colaboradores',
          value: String(stats?.infrastructure?.employees || 0),
          accent: '#0f766e',
          note: 'Equipo activo',
        },
      ];

      secondaryCards.forEach((item, index) => {
        OwnerDashboardService.drawMetricCard(doc, {
          x: 40 + index * (cardW + cardGap),
          y: kpi2Y,
          width: cardW,
          label: item.label,
          value: item.value,
          accent: item.accent,
          note: item.note,
        });
      });

      const officeData = (stats?.reports?.income_by_office || []).map((item) => ({
        label: `${item.office_name}${item.clinic_name ? ` · ${item.clinic_name}` : ''}`,
        value: item.total_income,
        amountLabel: OwnerDashboardService.formatMoney(item.total_income),
      }));

      const receptionistData = (stats?.reports?.income_by_receptionist || []).map((item) => ({
        label: item.cashier_name,
        value: item.total_income,
        amountLabel: OwnerDashboardService.formatMoney(item.total_income),
      }));

      const timelineData = (stats?.reports?.timeline || []).map((item) => ({
        label: item.label,
        value: item.total_income,
      }));

      const chartsTop = kpi2Y + 96;
      OwnerDashboardService.drawBarChart(doc, {
        x: 40,
        y: chartsTop,
        width: 255,
        height: 220,
        title: 'Ingresos por Consultorio',
        subtitle: 'Top consultorios con mayor facturación',
        data: officeData,
        barColor: theme.navy,
      });

      OwnerDashboardService.drawBarChart(doc, {
        x: 305,
        y: chartsTop,
        width: 250,
        height: 220,
        title: 'Cobros por Recepcionista',
        subtitle: 'Monto capturado por usuario de caja',
        data: receptionistData,
        barColor: theme.success,
      });

      const chart2Top = chartsTop + 238;
      OwnerDashboardService.drawLineChart(doc, {
        x: 40,
        y: chart2Top,
        width: 515,
        height: 220,
        title: 'Tendencia Diaria de Ingresos',
        subtitle: 'Evolución del ingreso por día en el periodo seleccionado',
        data: timelineData,
        strokeColor: theme.accent,
      });

      const tableTop = chart2Top + 242;
      OwnerDashboardService.drawSectionHeader(
        doc,
        'Resumen Ejecutivo',
        'Top 5 para lectura rápida de dirección',
        tableTop,
      );

      const topOffices = officeData.slice(0, 5);
      const topCashiers = receptionistData.slice(0, 5);
      const topTimeline = timelineData.slice(-5);

      doc
        .roundedRect(40, doc.y - 8, 515, 104, 12)
        .fillAndStroke('#ffffff', theme.border);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(theme.slate)
        .text('Consultorio', 52, doc.y)
        .text('Ingresos', 248, doc.y)
        .text('Recepcionista', 352, doc.y)
        .text('Cobros', 510, doc.y);

      doc.moveDown(0.8);

      const summaryRows = Math.max(topOffices.length, topCashiers.length, topTimeline.length, 1);
      for (let i = 0; i < summaryRows; i += 1) {
        const rowY = doc.y + i * 18;
        if (i % 2 === 1) {
          doc.roundedRect(48, rowY - 2, 499, 14, 4).fill('#f8fafc');
        }
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(theme.navy)
          .text(topOffices[i]?.label || '-', 52, rowY, { width: 180, ellipsis: true })
          .text(topOffices[i]?.amountLabel || '-', 248, rowY, { width: 90, align: 'right' })
          .text(topCashiers[i]?.label || '-', 352, rowY, { width: 150, ellipsis: true })
          .text(topCashiers[i]?.amountLabel || '-', 510, rowY, { width: 50, align: 'right' });
      }

      doc.moveDown(summaryRows + 2);

      const summaryNoteY = doc.y + 10;
      doc.roundedRect(40, summaryNoteY - 2, 515, 34, 10).fill('#eef4ff');
      doc
        .font('Helvetica')
        .fontSize(7.8)
        .fillColor(theme.slate)
        .text(
          'Nota ejecutiva: las métricas y gráficas reflejan movimientos reales de caja y respetan el filtro aplicado en el dashboard. Este informe está diseñado para revisión gerencial y cierre operativo.',
          52,
          summaryNoteY + 6,
          { width: 515 },
        );

      addFooter();

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
