const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ datasources: { db: { url: 'file:./dev.db' } } });

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@aegis.local' } });
  console.log('User found:', user ? 'YES' : 'NO');
  if (user) {
    const ok = await argon2.verify(user.passwordHash, 'ChangeMeNow!123');
    console.log('Password valid:', ok ? 'YES' : 'NO');
  }
  await prisma.$disconnect();
}

test().catch(console.error);





