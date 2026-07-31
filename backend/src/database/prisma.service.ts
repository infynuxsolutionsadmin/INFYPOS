import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to PostgreSQL via Prisma ORM...');
    await this.$connect();
    this.logger.log('PostgreSQL database connection established.');

    // Execute safe database-level migration from ':view' to ':read'
    await this.migrateViewToReadPermissions();

    // Backfill any missing Inventory records for existing products
    await this.backfillMissingInventoryRecords();

    // Backfill missing role-permission assignments (e.g. customers:delete for OWNER)
    await this.backfillMissingRolePermissions();

    // Hard-delete any seeded demo customers
    await this.cleanupSeededCustomers();

    // Auto-seed UK VAT Rates (Standard 20% default, Reduced 5%, Zero Rated 0%)
    await this.seedUkVatRates();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from PostgreSQL...');
    await this.$disconnect();
    this.logger.log('PostgreSQL database connection closed.');
  }

  private async migrateViewToReadPermissions(): Promise<void> {
    try {
      const viewPermissions = await this.permission.findMany({
        where: {
          code: {
            endsWith: ':view',
          },
        },
      });

      if (viewPermissions.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${viewPermissions.length} permissions with ':view' suffix. Starting migration to ':read'...`,
      );

      for (const perm of viewPermissions) {
        const newCode = perm.code.replace(/:view$/, ':read');

        const targetExist = await this.permission.findUnique({
          where: { code: newCode },
        });

        if (targetExist) {
          const oldAssignments = await this.rolePermission.findMany({
            where: { permissionId: perm.id },
          });

          for (const assignment of oldAssignments) {
            const alreadyAssigned = await this.rolePermission.findFirst({
              where: {
                roleId: assignment.roleId,
                permissionId: targetExist.id,
              },
            });

            if (alreadyAssigned) {
              await this.rolePermission.delete({
                where: { id: assignment.id },
              });
            } else {
              await this.rolePermission.update({
                where: { id: assignment.id },
                data: { permissionId: targetExist.id },
              });
            }
          }

          await this.permission.delete({
            where: { id: perm.id },
          });
        } else {
          await this.permission.update({
            where: { id: perm.id },
            data: {
              code: newCode,
            },
          });
        }
      }

      this.logger.log(
        "Permissions migration to ':read' naming convention completed successfully.",
      );
    } catch (error) {
      this.logger.error(
        `Database migration from ':view' to ':read' failed: ${error.message}`,
      );
    }
  }

  private async backfillMissingInventoryRecords(): Promise<void> {
    try {
      this.logger.log('Checking for missing Inventory records to backfill...');
      const products = await this.product.findMany({
        where: { deletedAt: null },
        select: { id: true, tenantId: true },
      });

      let backfilledCount = 0;

      for (const product of products) {
        const activeStores = await this.store.findMany({
          where: { tenantId: product.tenantId, deletedAt: null },
          select: { id: true },
        });

        for (const store of activeStores) {
          const exists = await this.inventory.findFirst({
            where: {
              storeId: store.id,
              productId: product.id,
              deletedAt: null,
            },
          });

          if (!exists) {
            await this.inventory.create({
              data: {
                tenantId: product.tenantId,
                storeId: store.id,
                productId: product.id,
                openingStock: 0,
                currentStock: 0,
                reservedStock: 0,
                damagedStock: 0,
              },
            });
            backfilledCount++;
          }
        }
      }

      if (backfilledCount > 0) {
        this.logger.log(`Successfully backfilled ${backfilledCount} missing Inventory records.`);
      } else {
        this.logger.log('No missing Inventory records found. Database is consistent.');
      }
    } catch (error) {
      this.logger.error(`Database backfill of missing Inventory records failed: ${error.message}`);
    }
  }

  private async backfillMissingRolePermissions(): Promise<void> {
    try {
      // Define which permissions each system role should have
      const rolePermissionMap: Record<string, string[]> = {
        OWNER: [
          'customers:create', 'customers:read', 'customers:update', 'customers:delete',
        ],
        MANAGER: [
          'customers:create', 'customers:read', 'customers:update',
        ],
        CASHIER: [
          'customers:create', 'customers:read',
        ],
      };

      const tenants = await this.tenant.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });

      for (const tenant of tenants) {
        for (const [roleName, permCodes] of Object.entries(rolePermissionMap)) {
          const role = await this.role.findFirst({
            where: { tenantId: tenant.id, name: roleName, deletedAt: null },
          });
          if (!role) continue;

          for (const code of permCodes) {
            const perm = await this.permission.findFirst({
              where: { tenantId: tenant.id, code },
            });
            if (!perm) continue;

            const exists = await this.rolePermission.findFirst({
              where: { roleId: role.id, permissionId: perm.id },
            });
            if (!exists) {
              await this.rolePermission.create({
                data: { roleId: role.id, permissionId: perm.id },
              });
              this.logger.log(`Backfilled permission ${code} for role ${roleName} in tenant ${tenant.id}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to backfill role permissions: ${error.message}`);
    }
  }

  private async cleanupSeededCustomers(): Promise<void> {
    try {
      const seededCodes = ['CUST-000001', 'CUST-000002', 'CUST-000003'];
      const seededEmails = ['john.doe@example.com', 'sarah.smith@example.com', 'michael.brown@example.com'];
      
      const seeded = await this.customer.findMany({
        where: {
          OR: [
            { code: { in: seededCodes } },
            { email: { in: seededEmails } },
          ],
        },
      });

      if (seeded.length > 0) {
        for (const c of seeded) {
          await this.customer.delete({ where: { id: c.id } });
        }
        this.logger.log(`Cleaned up ${seeded.length} seeded demo customer(s).`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup seeded customers: ${error.message}`);
    }
  }

  private async seedUkVatRates(): Promise<void> {
    try {
      const tenants = await this.tenant.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });

      const defaultRates = [
        { name: 'Standard VAT', percentage: 20, isDefault: true },
        { name: 'Reduced VAT', percentage: 5, isDefault: false },
        { name: 'Zero Rated', percentage: 0, isDefault: false },
      ];

      for (const tenant of tenants) {
        let tax = await this.tax.findFirst({
          where: { tenantId: tenant.id, code: 'UK_VAT', deletedAt: null },
        });

        if (!tax) {
          tax = await this.tax.create({
            data: {
              tenantId: tenant.id,
              name: 'UK VAT',
              code: 'UK_VAT',
              type: 'EXCLUSIVE',
              description: 'UK Value Added Tax',
            },
          });
          this.logger.log(`Created UK_VAT tax group for tenant ${tenant.id}`);
        }

        for (const rate of defaultRates) {
          const exists = await this.vatRate.findFirst({
            where: { tenantId: tenant.id, taxId: tax.id, name: rate.name, deletedAt: null },
          });

          if (!exists) {
            await this.vatRate.create({
              data: {
                tenantId: tenant.id,
                taxId: tax.id,
                name: rate.name,
                percentage: rate.percentage,
                isDefault: rate.isDefault,
              },
            });
            this.logger.log(`Seeded ${rate.name} (${rate.percentage}%) for tenant ${tenant.id}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to seed UK VAT rates: ${error.message}`);
    }
  }
}

