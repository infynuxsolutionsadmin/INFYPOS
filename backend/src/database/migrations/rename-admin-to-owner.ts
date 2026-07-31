/**
 * Migration: rename-admin-to-owner.ts
 *
 * SAFE data migration for existing INFYPOS tenants.
 *
 * What this migration does:
 *  1. Finds every Role record where name = 'ADMIN' and isSystem = true
 *  2. Renames it to 'OWNER'
 *  3. Sets rank = 100 (if not already set)
 *  4. Updates description to match new terminology
 *  5. Upserts MANAGER (rank=70) and CASHIER (rank=10) system roles per tenant
 *     (only creates them if they don't already exist)
 *  6. Applies the rank = 0 → correct rank fix for any MANAGER/CASHIER that was
 *     created before the rank column existed
 *
 * Safety guarantees:
 *  - Runs inside a Prisma transaction — all-or-nothing
 *  - Idempotent — safe to run multiple times (uses upsert where possible)
 *  - Zero downtime — no users lose access; their roleId stays unchanged
 *  - No JWT token invalidation required — roleName is loaded from DB on every request
 *
 * Usage:
 *   npx ts-node src/database/migrations/rename-admin-to-owner.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/infypos?schema=public';

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

const SYSTEM_ROLES_DEFAULTS: Array<{
  name: string;
  description: string;
  rank: number;
}> = [
  {
    name: 'OWNER',
    description:
      'Tenant Owner — full administrative control over the tenant organization',
    rank: 100,
  },
  {
    name: 'MANAGER',
    description:
      'Store Manager — manages assigned stores, inventory, staff, and reports',
    rank: 70,
  },
  {
    name: 'CASHIER',
    description:
      'Cashier — processes sales, manages shifts, and issues receipts',
    rank: 10,
  },
];

async function main() {
  console.log('──────────────────────────────────────────────────────────');
  console.log('  INFYPOS RBAC Migration: rename-admin-to-owner');
  console.log('──────────────────────────────────────────────────────────\n');

  // 1. Load all existing tenants
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${tenants.length} active tenant(s) to process.\n`);

  let tenantsProcessed = 0;
  let rolesRenamed = 0;
  let rolesCreated = 0;
  let ranksFixed = 0;

  for (const tenant of tenants) {
    console.log(
      `\nProcessing tenant: ${tenant.name} (${tenant.slug}) [${tenant.id}]`,
    );

    await prisma.$transaction(async (tx) => {
      // ── Step 1: Rename ADMIN → OWNER ──────────────────────────────────────
      const adminRole = await tx.role.findFirst({
        where: {
          tenantId: tenant.id,
          name: 'ADMIN',
          isSystem: true,
          deletedAt: null,
        },
      });

      if (adminRole) {
        await tx.role.update({
          where: { id: adminRole.id },
          data: {
            name: 'OWNER',
            description:
              'Tenant Owner — full administrative control over the tenant organization',
            rank: 100,
          },
        });
        console.log(`  ✅ Renamed ADMIN → OWNER (id: ${adminRole.id})`);
        rolesRenamed++;
      } else {
        console.log('  ℹ️  No ADMIN role found — skipping rename.');
      }

      // ── Step 2: Fix rank on existing OWNER if already renamed but rank=0 ──
      const ownerRole = await tx.role.findFirst({
        where: { tenantId: tenant.id, name: 'OWNER', deletedAt: null },
      });

      if (ownerRole && ownerRole.rank !== 100) {
        await tx.role.update({
          where: { id: ownerRole.id },
          data: { rank: 100 },
        });
        console.log(`  🔧 Fixed OWNER rank: ${ownerRole.rank} → 100`);
        ranksFixed++;
      }

      // ── Step 3: Ensure MANAGER and CASHIER system roles exist ─────────────
      for (const roleDef of SYSTEM_ROLES_DEFAULTS.filter(
        (r) => r.name !== 'OWNER',
      )) {
        const existingRole = await tx.role.findFirst({
          where: {
            tenantId: tenant.id,
            name: roleDef.name,
            deletedAt: null,
          },
        });

        if (!existingRole) {
          await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: roleDef.name,
              description: roleDef.description,
              rank: roleDef.rank,
              isSystem: true,
            },
          });
          console.log(
            `  ✅ Created system role: ${roleDef.name} (rank=${roleDef.rank})`,
          );
          rolesCreated++;
        } else if (existingRole.rank !== roleDef.rank) {
          // Fix rank if role exists but rank was 0 (pre-migration schema)
          await tx.role.update({
            where: { id: existingRole.id },
            data: { rank: roleDef.rank },
          });
          console.log(
            `  🔧 Fixed ${roleDef.name} rank: ${existingRole.rank} → ${roleDef.rank}`,
          );
          ranksFixed++;
        } else {
          console.log(
            `  ℹ️  ${roleDef.name} already exists with correct rank (${roleDef.rank})`,
          );
        }
      }
    });

    tenantsProcessed++;
  }

  console.log('\n──────────────────────────────────────────────────────────');
  console.log('  Migration Summary');
  console.log('──────────────────────────────────────────────────────────');
  console.log(`  Tenants processed : ${tenantsProcessed}`);
  console.log(`  Roles renamed     : ${rolesRenamed}  (ADMIN → OWNER)`);
  console.log(`  Roles created     : ${rolesCreated}  (new MANAGER/CASHIER)`);
  console.log(`  Ranks fixed       : ${ranksFixed}`);
  console.log('\n  ✅ Migration completed successfully.\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
