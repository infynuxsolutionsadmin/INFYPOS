import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { tenantId: '82517288-00d8-4d5a-9e29-508089fc061c' },
    select: { email: true, firstName: true, lastName: true },
  });
  console.log('Users for team tenant:', users);
}

main().finally(async () => {
  await prisma.$disconnect();
});
