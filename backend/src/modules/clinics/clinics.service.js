const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const {
  assertRequiredText,
  assertOptionalText,
  assertOptionalPhone,
} = require("../../utils/validators");

class ClinicsService {
  static async createClinic(organizationId, data) {
    const safeName = assertRequiredText(
      data.name,
      "El nombre de la clínica",
      2,
      120,
    );
    const safeAddress = assertOptionalText(
      data.address,
      "La dirección de la clínica",
      250,
    );
    const safePhone = assertOptionalPhone(
      data.phone,
      "El teléfono de la clínica",
    );

    // Por defecto el status es PENDING_PAYMENT gracias al prisma schema
    return await db.clinic.create({
      data: {
        organization_id: organizationId,
        name: safeName,
        address: safeAddress,
        phone: safePhone,
      },
    });
  }

  static async getClinicsByOrg(organizationId) {
    return await db.clinic.findMany({
      where: { organization_id: organizationId },
      include: {
        offices: true,
      },
    });
  }

  static async updateClinic(clinicId, organizationId, data) {
    // Validar que la clínica pertenezca a la organización
    const clinic = await db.clinic.findFirst({
      where: { id: clinicId, organization_id: organizationId },
    });
    if (!clinic) throw new AppError("Clínica no encontrada o inaccesible", 404);

    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = assertRequiredText(
        data.name,
        "El nombre de la clínica",
        2,
        120,
      );
    }
    if (data.address !== undefined) {
      updateData.address = assertOptionalText(
        data.address,
        "La dirección de la clínica",
        250,
      );
    }
    if (data.phone !== undefined) {
      updateData.phone = assertOptionalPhone(
        data.phone,
        "El teléfono de la clínica",
      );
    }
    if (data.logo_url !== undefined) {
      updateData.logo_url = assertOptionalText(
        data.logo_url,
        "La URL del logo",
        500,
      );
    }

    return await db.clinic.update({
      where: { id: clinicId },
      data: updateData,
    });
  }

  static async createOffice(clinicId, data, organizationId) {
    // Verificar que la clínica pertenezca a la organización
    const clinic = await db.clinic.findFirst({
      where: { id: clinicId, organization_id: organizationId },
    });

    if (!clinic)
      throw new AppError("Clínica no encontrada o no autorizada", 404);

    return await db.office.create({
      data: {
        clinic_id: clinicId,
        name: assertRequiredText(
          data.name,
          "El nombre del consultorio",
          2,
          100,
        ),
        floor: assertOptionalText(data.floor, "El nivel del consultorio", 60),
      },
    });
  }

  static async getOfficesByClinic(clinicId, organizationId) {
    const clinic = await db.clinic.findFirst({
      where: { id: clinicId, organization_id: organizationId },
    });
    if (!clinic)
      throw new AppError("Clínica no encontrada o no autorizada", 404);

    return await db.office.findMany({
      where: { clinic_id: clinicId },
      orderBy: { name: "asc" },
    });
  }
}

module.exports = ClinicsService;
