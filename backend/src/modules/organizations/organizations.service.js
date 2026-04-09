const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError');

class OrganizationsService {
  static async createOrganization(data) {
    const { name, slug, owner_first_name, owner_last_name, owner_email, owner_password } = data;

    // Verificar slug repetido
    const exists = await db.organization.findUnique({ where: { slug } });
    if (exists) {
      throw new AppError('El identificador del negocio (slug) ya existe.', 400);
    }

    // Verificar email repetido global
    const emailExists = await db.user.findUnique({ where: { email: owner_email } });
    if (emailExists) {
      throw new AppError('El email del dueño ya está registrado en la base de datos.', 400);
    }

    const hashedPassword = await bcrypt.hash(owner_password, 10);

    // Crear Organización y su Owner atado en la misma transacción temporalmente, o con create
    const organization = await db.organization.create({
      data: {
        name,
        slug,
        users: {
          create: {
            email: owner_email,
            password_hash: hashedPassword,
            first_name: owner_first_name,
            last_name: owner_last_name,
            role: 'OWNER'
          }
        }
      },
      include: {
        users: true
      }
    });

    return organization;
  }

  static async getAllOrganizations() {
    return await db.organization.findMany({
      include: {
        _count: {
          select: { clinics: true, users: true }
        }
      },
      orderBy: { created_at: 'desc' }
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
            patients: true
          }
        },
        clinics: {
          include: {
            _count: {
              select: { offices: true, appointments: true }
            }
          }
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
            is_active: true
          }
        }
      }
    });

    if (!org) throw new AppError('Negocio no encontrado', 404);
    return org;
  }
}

module.exports = OrganizationsService;
