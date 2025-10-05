const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
  const tableNames = [
    'TransferBeneficiary',
    'Card',
    'InvoiceItem',
    'InvoiceCustomer',
    'Invoice',
    'Account',
    'Balance',
    'Transaction',
    'ExchangeRate',
    'User',
  ];

  for (const table of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
}

async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: overrides.email || `user_${Date.now()}@example.com`,
      password: overrides.password || 'hashed-password',
      name: overrides.name || 'Test User',
      phoneNumber: overrides.phoneNumber || '1234567890',
      accountType: overrides.accountType || 'Freelancer',
      mapleradCustomerId: overrides.mapleradCustomerId || null,
      verify_email: overrides.verify_email || 1,
      ...overrides,
    },
  });
}

function createJwt(prismaUser) {
  return jwt.sign(
    {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      phone: prismaUser.phoneNumber,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = {
  prisma,
  resetDatabase,
  createUser,
  createJwt,
};
