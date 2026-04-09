const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const appt = await prisma.appointment.findFirst({
    where: { is_paid: false }
  });
  
  if(!appt) {
    console.log("No pending appts");
    return;
  }
  
  console.log("Found appt:", appt.id, appt.total_amount);
  
  let finalAmount = "600";
  const actualAmount = finalAmount !== null ? parseFloat(finalAmount) : parseFloat(appt.total_amount);
  
  console.log("actualAmount will be:", actualAmount);
  
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      is_paid: true,
      status: 'COMPLETED',
      total_amount: actualAmount
    }
  });
  
  console.log("Updated appt total_amount:", updatedAppointment.total_amount);

  const cashRegister = await prisma.cashRegister.create({
    data: {
      organization_id: appt.organization_id,
      clinic_id: appt.clinic_id,
      appointment_id: appt.id,
      type: 'INCOME',
      amount: actualAmount,
      description: `Cobro de consulta (Cita: ${appt.id})`,
      category: 'APPOINTMENT_PAYMENT',
      registered_by: appt.created_by
    }
  });
  console.log("CashRegister amount:", cashRegister.amount);
}

run().catch(console.error).finally(() => prisma.$disconnect());
