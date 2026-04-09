const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  console.log('--- Limpiando base de datos ---');
  await prisma.userOfficeAssignment.deleteMany();
  await prisma.userClinicAssignment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.office.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('--- Creando SuperAdmin ---');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@dentalcare.com',
      password_hash: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'SUPER_ADMIN',
    }
  });

  console.log('--- Creando Organización y Owner ---');
  const org = await prisma.organization.create({
    data: {
      name: 'DentalCare Medical Group',
      slug: 'dentalcare-group',
      plan: 'PREMIUM',
      is_active: true
    }
  });

  const owner = await prisma.user.create({
    data: {
      email: 'owner@dentalcare.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'Owner',
      role: 'OWNER',
      organization_id: org.id
    }
  });

  console.log('--- Creando Clínica y Oficinas iniciales ---');
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Sucursal Centro',
      organization_id: org.id,
      status: 'ACTIVE',
      address: 'Calle Ficticia 123, Ciudad'
    }
  });

  await prisma.office.createMany({
    data: [
      { name: 'Consultorio A1', clinic_id: clinic.id, floor: '1' },
      { name: 'Consultorio A2', clinic_id: clinic.id, floor: '1' }
    ]
  });

  console.log('==========================================');
  console.log('SEEDS COMPLETADOS CORRECTAMENTE');
  console.log('Email Owner: owner@dentalcare.com');
  console.log('Password: admin123');
  console.log('==========================================');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
