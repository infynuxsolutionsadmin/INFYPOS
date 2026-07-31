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
  const tenantId = '82517288-00d8-4d5a-9e29-508089fc061c'; // Tenant 'team'
  const items = await prisma.inventory.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      product: {
        select: { name: true, sku: true, reorderLevel: true, minimumStock: true, trackInventory: true },
      },
    },
  });

  console.log('| Product | Stock | Reorder | Minimum | Track Inventory |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const item of items) {
    console.log(
      `| ${item.product.name} | ${Number(item.currentStock)} | ${Number(item.product.reorderLevel)} | ${Number(item.product.minimumStock)} | ${item.product.trackInventory} |`
    );
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
