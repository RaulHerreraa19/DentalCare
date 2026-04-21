const db = require("../../config/database");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/AppError");
const {
  assertRequiredText,
  assertEmail,
  assertStrongPassword,
  assertSlug,
} = require("../../utils/validators");

class OrganizationsService {
  static async createOrganization(data) {
    const {
      name,
      slug,
      owner_first_name,
      owner_last_name,
      owner_email,
      owner_password,
    } = data;
    const safeName = assertRequiredText(name, "El nombre del negocio", 2, 140);
    const safeSlug = assertSlug(slug, "El identificador del negocio");
    const safeOwnerFirstName = assertRequiredText(
      owner_first_name,
      "El nombre del dueño",
      2,
      80,
    );
    const safeOwnerLastName = assertRequiredText(
      owner_last_name,
      "El apellido del dueño",
      2,
      80,
    );
    const safeOwnerEmail = assertEmail(owner_email, "El correo del dueño");
    const safeOwnerPassword = assertStrongPassword(
      owner_password,
      "La contraseña del dueño",
    );

    // Verificar slug repetido
    const exists = await db.organization.findUnique({
      where: { slug: safeSlug },
    });
    if (exists) {
      throw new AppError("El identificador del negocio (slug) ya existe.", 400);
    }

    // Verificar email repetido global
    const emailExists = await db.user.findUnique({
      where: { email: safeOwnerEmail },
    });
    if (emailExists) {
      throw new AppError(
        "El email del dueño ya está registrado en la base de datos.",
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(safeOwnerPassword, 10);

    // Crear Organización y su Owner atado en la misma transacción temporalmente, o con create
    const organization = await db.organization.create({
      data: {
        name: safeName,
        slug: safeSlug,
        users: {
          create: {
            email: safeOwnerEmail,
            password_hash: hashedPassword,
            first_name: safeOwnerFirstName,
            last_name: safeOwnerLastName,
            role: "OWNER",
          },
        },
      },
      include: {
        users: true,
      },
    });

    return organization;
  }

  static async getAllOrganizations() {
    return await db.organization.findMany({
      include: {
        _count: {
          select: { clinics: true, users: true },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getOrganizationDetails(id) {
    const org = await db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clinics: true,
            users: true,
            patients: true,
          },
        },
        clinics: {
          include: {
            _count: {
              select: { offices: true, appointments: true },
            },
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
      },
    });

    if (!org) throw new AppError("Negocio no encontrado", 404);
    return org;
  }
}

module.exports = OrganizationsService;
