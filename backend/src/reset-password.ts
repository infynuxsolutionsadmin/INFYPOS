import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    where: { email: 'naveendseven@gmail.com' },
    data: { passwordHash: hashedPassword },
  });
  console.log('Password successfully reset to "password123" for naveendseven@gmail.com');
}

main().finally(async () => {
  await prisma.$disconnect();
});
