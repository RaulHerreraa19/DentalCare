const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const {
  assertRequiredText,
  assertOptionalEmail,
  assertPhone,
  assertOptionalText,
} = require("../../utils/validators");

const VALID_GENDERS = ["M", "F", "O", "OTHER"];

const normalizeGender = (gender) => {
  if (gender === undefined) return undefined;
  if (gender === null || gender === "") return null;

  const normalized = String(gender).trim().toUpperCase();
  if (!VALID_GENDERS.includes(normalized)) {
    throw new AppError("El género no es válido.", 400);
  }

  if (normalized === "O" || normalized === "OTHER") return "OTHER";
  return normalized;
};

class PatientsService {
  static async createPatient(organizationId, data) {
    const safeFirstName = assertRequiredText(
      data.first_name,
      "El nombre",
      2,
      80,
    );
    const safeLastName = assertRequiredText(
      data.last_name,
      "El apellido",
      2,
      80,
    );
    const safePhone = assertPhone(data.phone, "El teléfono del paciente");
    const safeEmail = assertOptionalEmail(data.email, "El correo del paciente");
    const safeGender = normalizeGender(data.gender);

    // Validar si el paciente (email/telefono) ya existe en la misma org para no duplicar (Opcional, pero recomendado)
    if (safeEmail) {
      const existing = await db.patient.findFirst({
        where: { email: safeEmail, organization_id: organizationId },
      });
      if (existing) {
        throw new AppError(
          "El correo electrónico ya está registrado para otro paciente.",
          400,
        );
      }
    }

    return await db.patient.create({
      data: {
        organization_id: organizationId,
        first_name: safeFirstName,
        last_name: safeLastName,
        email: safeEmail,
        phone: safePhone,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        gender: safeGender,
        address: assertOptionalText(data.address, "La dirección", 250),
        emergency_contact: assertOptionalText(
          data.emergency_contact,
          "El contacto de emergencia",
          120,
        ),
        notes: assertOptionalText(data.notes, "Las notas", 1000),
      },
    });
  }

  static async getPatients(organizationId, search = "") {
    const whereClause = { organization_id: organizationId };
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    return await db.patient.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: 50, // Límite para evitar query gigante
    });
  }

  static async getPatientById(organizationId, patientId) {
    const patient = await db.patient.findFirst({
      where: { id: patientId, organization_id: organizationId },
      include: {
        appointments: {
          orderBy: { start_time: "desc" },
          take: 5,
        },
      },
    });

    if (!patient)
      throw new AppError(
        "Paciente no encontrado o no pertenece a tu organización.",
        404,
      );
    return patient;
  }

  static async updatePatient(organizationId, patientId, data) {
    const patient = await db.patient.findFirst({
      where: { id: patientId, organization_id: organizationId },
    });

    if (!patient)
      throw new AppError(
        "Paciente no encontrado o no pertenece a tu organización.",
        404,
      );

    const safeFirstName =
      data.first_name !== undefined
        ? assertRequiredText(data.first_name, "El nombre", 2, 80)
        : patient.first_name;
    const safeLastName =
      data.last_name !== undefined
        ? assertRequiredText(data.last_name, "El apellido", 2, 80)
        : patient.last_name;
    const safeEmail =
      data.email !== undefined
        ? assertOptionalEmail(data.email, "El correo del paciente")
        : patient.email;
    const safePhone =
      data.phone !== undefined
        ? assertPhone(data.phone, "El teléfono del paciente")
        : patient.phone;
    const safeGender =
      data.gender !== undefined ? normalizeGender(data.gender) : patient.gender;

    return await db.patient.update({
      where: { id: patientId },
      data: {
        first_name: safeFirstName,
        last_name: safeLastName,
        email: safeEmail,
        phone: safePhone,
        date_of_birth:
          data.date_of_birth !== undefined
            ? data.date_of_birth
              ? new Date(data.date_of_birth)
              : null
            : patient.date_of_birth,
        gender: safeGender,
        address:
          data.address !== undefined
            ? assertOptionalText(data.address, "La dirección", 250)
            : patient.address,
        emergency_contact:
          data.emergency_contact !== undefined
            ? assertOptionalText(
                data.emergency_contact,
                "El contacto de emergencia",
                120,
              )
            : patient.emergency_contact,
        notes:
          data.notes !== undefined
            ? assertOptionalText(data.notes, "Las notas", 1000)
            : patient.notes,
      },
    });
  }
}

module.exports = PatientsService;
