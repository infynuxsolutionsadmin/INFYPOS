const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:postgres@localhost:5432/infypos";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('--- TENANTS ---');
    console.log(tenants);

    const stores = await prisma.store.findMany();
    console.log('--- STORES ---');
    console.log(stores.map(s => ({ id: s.id, tenantId: s.tenantId, name: s.name, deletedAt: s.deletedAt })));

    const products = await prisma.product.findMany();
    console.log('--- PRODUCTS ---');
    console.log(products.map(p => ({ id: p.id, tenantId: p.tenantId, name: p.name, deletedAt: p.deletedAt })));

    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    console.log(users.map(u => ({ id: u.id, tenantId: u.tenantId, email: u.email })));

    const inventory = await prisma.inventory.findMany();
    console.log('--- INVENTORY RECORDS ---');
    console.log(inventory.map(i => ({ id: i.id, tenantId: i.tenantId, storeId: i.storeId, productId: i.productId, currentStock: i.currentStock })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
