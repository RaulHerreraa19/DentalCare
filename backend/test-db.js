const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const org = await prisma.organization.findFirst();
  console.log('ID:', org?.id);
  console.log('Name:', org?.name);
}
main().finally(() => prisma.$disconnect());
