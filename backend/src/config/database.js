const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({
  log: ['error', 'warn'],
});

module.exports = db;
