const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");

  // Delete in order to avoid foreign key constraints (Children before Parents)
  await prisma.auditLog.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.medicalNoteVersion.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalNote.deleteMany();
  await prisma.odontogram.deleteMany();
  await prisma.medicalRecordVersion.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.userOfficeAssignment.deleteMany();
  await prisma.userClinicAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.office.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. SUPER ADMIN
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@dentalcare.com",
      password_hash: hashedPassword,
      first_name: "Super",
      last_name: "Admin",
      role: "SUPER_ADMIN",
      is_active: true,
    },
  });
  console.log("Created SuperAdmin: admin@dentalcare.com");

  // 2. ORGANIZATIONS
  const org1 = await prisma.organization.create({
    data: {
      name: "DentalSmile Clinic",
      slug: "dentalsmile",
      plan: "PREMIUM",
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: "HealthyTeeth Center",
      slug: "healthyteeth",
      plan: "BASIC",
    },
  });
  console.log("Created Organizations: DentalSmile, HealthyTeeth");

  // 3. CLINICS
  const clinic1 = await prisma.clinic.create({
    data: {
      organization_id: org1.id,
      name: "DentalSmile Main Branch",
      address: "Calle Falsa 123",
      phone: "555-0101",
      status: "ACTIVE",
    },
  });

  const clinic2 = await prisma.clinic.create({
    data: {
      organization_id: org2.id,
      name: "HealthyTeeth Central",
      address: "Avenida Siempre Viva 742",
      phone: "555-0202",
      status: "ACTIVE",
    },
  });
  console.log("Created Clinics");

  // 4. OFFICES
  const office1 = await prisma.office.create({
    data: {
      clinic_id: clinic1.id,
      name: "Consultorio 1 (Ortodoncia)",
      status: "ACTIVE",
    },
  });

  const office2 = await prisma.office.create({
    data: {
      clinic_id: clinic2.id,
      name: "Consultorio A (General)",
      status: "ACTIVE",
    },
  });
  console.log("Created Offices");

  // 5. USERS - OWNERS
  const owner1 = await prisma.user.create({
    data: {
      organization_id: org1.id,
      email: "owner1@dentalsmile.com",
      password_hash: hashedPassword,
      first_name: "Roberto",
      last_name: "Dueño",
      role: "OWNER",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      organization_id: org2.id,
      email: "owner2@healthyteeth.com",
      password_hash: hashedPassword,
      first_name: "Ana",
      last_name: "Propietaria",
      role: "OWNER",
    },
  });

  // 6. USERS - DOCTORS
  const doctor1 = await prisma.user.create({
    data: {
      organization_id: org1.id,
      email: "doctor1@dentalsmile.com",
      password_hash: hashedPassword,
      first_name: "Gregory",
      last_name: "House",
      role: "DOCTOR",
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      organization_id: org2.id,
      email: "doctor2@healthyteeth.com",
      password_hash: hashedPassword,
      first_name: "Meredith",
      last_name: "Grey",
      role: "DOCTOR",
    },
  });

  // 7. USERS - RECEPTIONISTS
  const recep1M = await prisma.user.create({
    data: {
      organization_id: org1.id,
      email: "recep1m@dentalsmile.com",
      password_hash: hashedPassword,
      first_name: "Laura",
      last_name: "Mañana",
      role: "RECEPTIONIST",
    },
  });

  const recep1T = await prisma.user.create({
    data: {
      organization_id: org1.id,
      email: "recep1t@dentalsmile.com",
      password_hash: hashedPassword,
      first_name: "Carlos",
      last_name: "Tarde",
      role: "RECEPTIONIST",
    },
  });

  const recep2M = await prisma.user.create({
    data: {
      organization_id: org2.id,
      email: "recep2m@healthyteeth.com",
      password_hash: hashedPassword,
      first_name: "Elena",
      last_name: "Mañana",
      role: "RECEPTIONIST",
    },
  });

  const recep2T = await prisma.user.create({
    data: {
      organization_id: org2.id,
      email: "recep2t@healthyteeth.com",
      password_hash: hashedPassword,
      first_name: "Diego",
      last_name: "Tarde",
      role: "RECEPTIONIST",
    },
  });
  console.log("Created Users (Owners, Doctors, Receptionists)");

  // 8. USER CLINIC ASSIGNMENTS
  const usersToAssign = [
    owner1,
    owner2,
    doctor1,
    doctor2,
    recep1M,
    recep1T,
    recep2M,
    recep2T,
  ];
  for (const user of usersToAssign) {
    await prisma.userClinicAssignment.create({
      data: {
        user_id: user.id,
        clinic_id: user.organization_id === org1.id ? clinic1.id : clinic2.id,
      },
    });
  }

  // 9. SERVICES
  const service1 = await prisma.service.create({
    data: {
      doctor_id: doctor1.id,
      name: "Limpieza Profunda",
      price: 500.0,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      doctor_id: doctor2.id,
      name: "Consulta General",
      price: 300.0,
    },
  });

  // 10. PATIENTS
  const patient1 = await prisma.patient.create({
    data: {
      organization_id: org1.id,
      first_name: "Juan",
      last_name: "Pérez",
      phone: "555-1234",
      email: "juan@example.com",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      organization_id: org2.id,
      first_name: "Maria",
      last_name: "Lopez",
      phone: "555-5678",
      email: "maria@example.com",
    },
  });

  // 11. DOCTOR SCHEDULES (Lunes a Viernes)
  for (let i = 1; i <= 5; i++) {
    await prisma.doctorSchedule.create({
      data: {
        doctor_id: doctor1.id,
        clinic_id: clinic1.id,
        day_of_week: i,
        start_time: "09:00",
        end_time: "18:00",
      },
    });
    await prisma.doctorSchedule.create({
      data: {
        doctor_id: doctor2.id,
        clinic_id: clinic2.id,
        day_of_week: i,
        start_time: "10:00",
        end_time: "19:00",
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
