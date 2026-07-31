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
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });
  console.log('Tenants:', tenants);

  for (const t of tenants) {
    const storesCount = await prisma.store.count({ where: { tenantId: t.id, deletedAt: null } });
    const productsCount = await prisma.product.count({ where: { tenantId: t.id, deletedAt: null } });
    const inventoryCount = await prisma.inventory.count({ where: { tenantId: t.id, deletedAt: null } });
    
    console.log(`Tenant: ${t.name} (${t.slug})`);
    console.log(`- Active Stores: ${storesCount}`);
    console.log(`- Active Products: ${productsCount}`);
    console.log(`- Inventory Records: ${inventoryCount}`);
    
    if (storesCount > 0) {
      const stores = await prisma.store.findMany({ where: { tenantId: t.id, deletedAt: null }, select: { id: true, name: true } });
      console.log('  Stores:', stores);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
