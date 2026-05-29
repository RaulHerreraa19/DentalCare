const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const {
  assertRequiredText,
  assertOptionalEmail,
  assertPhone,
  assertOptionalText,
} = require("../../utils/validators");

const VALID_GENDERS = ["M", "F", "O", "OTHER"];
const DEFAULT_LEGACY_TAKE = 50;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const VALID_MODES = ["legacy", "paginated"];
const VALID_SORT_FIELDS = ["created_at", "first_name", "last_name"];
const VALID_SORT_DIRECTIONS = ["asc", "desc"];

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
  static hasPaginationParamsInLegacyQuery(rawQuery = {}) {
    return (
      rawQuery.page !== undefined ||
      rawQuery.pageSize !== undefined ||
      rawQuery.page_size !== undefined ||
      rawQuery.sortBy !== undefined ||
      rawQuery.sortDir !== undefined
    );
  }

  static buildSearchWhere(searchTerm) {
    if (!searchTerm) return undefined;

    return [
      { first_name: { contains: searchTerm, mode: "insensitive" } },
      { last_name: { contains: searchTerm, mode: "insensitive" } },
      { phone: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  static parseListQuery(rawQuery = {}) {
    const rawMode =
      rawQuery.mode === undefined || rawQuery.mode === null
        ? "legacy"
        : String(rawQuery.mode).trim().toLowerCase();

    if (!VALID_MODES.includes(rawMode)) {
      throw new AppError(
        "Parámetro mode inválido. Usa 'legacy' o 'paginated'.",
        400,
      );
    }

    const normalizedSearch = String(rawQuery.q ?? rawQuery.search ?? "").trim();

    if (rawMode === "legacy") {
      return {
        mode: "legacy",
        search: normalizedSearch,
        hasIgnoredPaginationParams:
          PatientsService.hasPaginationParamsInLegacyQuery(rawQuery),
      };
    }

    const rawPage = rawQuery.page ?? "1";
    const parsedPage = Number(rawPage);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new AppError(
        "El parámetro page debe ser un entero mayor o igual a 1.",
        400,
      );
    }

    const rawPageSize =
      rawQuery.pageSize ?? rawQuery.page_size ?? DEFAULT_PAGE_SIZE;
    const parsedPageSize = Number(rawPageSize);
    if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1) {
      throw new AppError(
        "El parámetro pageSize debe ser un entero mayor o igual a 1.",
        400,
      );
    }

    const pageSize = Math.min(parsedPageSize, MAX_PAGE_SIZE);

    const sortBy = String(rawQuery.sortBy ?? "created_at")
      .trim()
      .toLowerCase();
    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      throw new AppError(
        "El parámetro sortBy no es válido. Usa created_at, first_name o last_name.",
        400,
      );
    }

    const sortDir = String(rawQuery.sortDir ?? "desc")
      .trim()
      .toLowerCase();
    if (!VALID_SORT_DIRECTIONS.includes(sortDir)) {
      throw new AppError(
        "El parámetro sortDir no es válido. Usa asc o desc.",
        400,
      );
    }

    return {
      mode: "paginated",
      search: normalizedSearch,
      page: parsedPage,
      pageSize,
      sortBy,
      sortDir,
      skip: (parsedPage - 1) * pageSize,
      take: pageSize,
      // Tie-break with id to keep deterministic ordering across pages.
      orderBy: [{ [sortBy]: sortDir }, { id: sortDir }],
    };
  }

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

  static async getPatients(organizationId, rawQuery = {}) {
    const query = PatientsService.parseListQuery(rawQuery);
    const whereClause = {
      organization_id: organizationId,
    };

    const searchWhere = PatientsService.buildSearchWhere(query.search);
    if (searchWhere) {
      whereClause.OR = searchWhere;
    }

    if (query.mode === "legacy") {
      const items = await db.patient.findMany({
        where: whereClause,
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: DEFAULT_LEGACY_TAKE,
      });

      return {
        mode: "legacy",
        data: items,
        telemetry: {
          search: query.search,
          returnedItems: items.length,
          limitedByLegacyCap: items.length === DEFAULT_LEGACY_TAKE,
          ignoredPaginationParams: query.hasIgnoredPaginationParams,
        },
      };
    }

    const [items, total] = await db.$transaction([
      db.patient.findMany({
        where: whereClause,
        orderBy: query.orderBy,
        skip: query.skip,
        take: query.take,
      }),
      db.patient.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const isOutOfRange = total > 0 && query.page > totalPages;

    return {
      mode: "paginated",
      data: {
        items,
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: total > 0 && query.page > 1,
        isOutOfRange,
        appliedFilters: {
          q: query.search,
          sortBy: query.sortBy,
          sortDir: query.sortDir,
        },
      },
      telemetry: {
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
        total,
        returnedItems: items.length,
      },
    };
  }

  static async getDoctorPatients(organizationId, doctorId) {
    const [records, appointments] = await Promise.all([
      db.medicalRecord.findMany({
        where: { organization_id: organizationId, doctor_id: doctorId },
        include: {
          patient: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              date_of_birth: true,
              gender: true,
              address: true,
              created_at: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
      }),
      db.appointment.findMany({
        where: { organization_id: organizationId, doctor_id: doctorId },
        include: {
          patient: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              date_of_birth: true,
              gender: true,
              address: true,
              created_at: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ start_time: "desc" }, { id: "desc" }],
      }),
    ]);

    const patientMap = new Map();

    for (const record of records) {
      if (!record.patient) continue;

      patientMap.set(record.patient.id, {
        ...record.patient,
        has_record: true,
        record_id: record.id,
        record_status: record.status,
        record_version: record.current_version,
        record_updated_at: record.updated_at,
        last_appointment_at: null,
        last_appointment_clinic: null,
        appointment_count: 0,
      });
    }

    for (const appointment of appointments) {
      if (!appointment.patient) continue;

      const existing = patientMap.get(appointment.patient.id);
      const appointmentInfo = {
        patient_id: appointment.patient.id,
        last_appointment_at: appointment.start_time,
        last_appointment_clinic: appointment.clinic,
        appointment_count: (existing?.appointment_count || 0) + 1,
      };

      if (!existing) {
        patientMap.set(appointment.patient.id, {
          ...appointment.patient,
          has_record: false,
          record_id: null,
          record_status: null,
          record_version: null,
          record_updated_at: null,
          ...appointmentInfo,
        });
      } else {
        patientMap.set(appointment.patient.id, {
          ...existing,
          ...appointmentInfo,
        });
      }
    }

    return Array.from(patientMap.values()).sort((a, b) => {
      const aTime = a.last_appointment_at ? new Date(a.last_appointment_at).getTime() : 0;
      const bTime = b.last_appointment_at ? new Date(b.last_appointment_at).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
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
