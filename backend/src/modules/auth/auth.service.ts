import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterTenantDto } from './dto/register.dto';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * System role definitions with stable ranks.
 * Ranks: OWNER=100, MANAGER=70, CASHIER=10
 * Higher rank = higher authority in the hierarchy.
 */
const SYSTEM_ROLES = [
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
] as const;

/**
 * Default permission codes seeded for every new tenant.
 * Format: `module:action`
 */
const DEFAULT_PERMISSIONS: Array<{
  code: string;
  name: string;
  module: string;
  description: string;
}> = [
  // Dashboard
  {
    code: 'dashboard:read',
    name: 'Read Dashboard',
    module: 'dashboard',
    description: 'Access main dashboard and metrics overview',
  },
  // Users
  {
    code: 'users:create',
    name: 'Create Users',
    module: 'users',
    description: 'Create new users within the tenant',
  },
  {
    code: 'users:read',
    name: 'Read Users',
    module: 'users',
    description: 'View user list and user details',
  },
  {
    code: 'users:update',
    name: 'Update Users',
    module: 'users',
    description: 'Update user profile and role assignments',
  },
  {
    code: 'users:delete',
    name: 'Delete Users',
    module: 'users',
    description: 'Soft-delete users within the tenant',
  },
  // Products
  {
    code: 'products:read',
    name: 'Read Products',
    module: 'products',
    description: 'View product catalog and details',
  },
  {
    code: 'products:create',
    name: 'Create Products',
    module: 'products',
    description: 'Create new products and categories',
  },
  {
    code: 'products:update',
    name: 'Update Products',
    module: 'products',
    description: 'Update product details, prices, and stock levels',
  },
  {
    code: 'products:delete',
    name: 'Delete Products',
    module: 'products',
    description: 'Archive or delete products from catalog',
  },
  // Inventory
  {
    code: 'inventory:read',
    name: 'Read Inventory',
    module: 'inventory',
    description: 'View inventory levels across stores',
  },
  {
    code: 'inventory:update',
    name: 'Update Inventory',
    module: 'inventory',
    description: 'Adjust stock levels and process purchase orders',
  },
  // Sales
  {
    code: 'sales:read',
    name: 'Read Sales',
    module: 'sales',
    description: 'View sales history and transaction details',
  },
  {
    code: 'sales:create',
    name: 'Create Sales',
    module: 'sales',
    description: 'Process customer checkout and issue receipts',
  },
  {
    code: 'sales:update',
    name: 'Update Sales',
    module: 'sales',
    description: 'Edit parked or draft sales before completion',
  },
  {
    code: 'sales:void',
    name: 'Void Sales',
    module: 'sales',
    description: 'Void a completed sale and restore inventory',
  },
  {
    code: 'sales:refund',
    name: 'Process Refunds',
    module: 'sales',
    description: 'Issue refunds and process returns',
  },
  // Payments
  {
    code: 'payments:create',
    name: 'Create Payments',
    module: 'payments',
    description: 'Record and process payment transactions',
  },
  {
    code: 'payments:read',
    name: 'Read Payments',
    module: 'payments',
    description: 'View payment records and history',
  },
  // Customers
  {
    code: 'customers:create',
    name: 'Create Customers',
    module: 'customers',
    description: 'Register new customer profiles',
  },
  {
    code: 'customers:read',
    name: 'Read Customers',
    module: 'customers',
    description: 'View customer profiles and purchase history',
  },
  {
    code: 'customers:update',
    name: 'Update Customers',
    module: 'customers',
    description: 'Modify customer profile information',
  },
  {
    code: 'customers:delete',
    name: 'Delete Customers',
    module: 'customers',
    description: 'Soft-delete customer records',
  },
  // Inventory (adjust — read and update defined above)
  {
    code: 'inventory:adjust',
    name: 'Adjust Inventory',
    module: 'inventory',
    description: 'Perform manual stock adjustments with movement records',
  },
  // Reports
  {
    code: 'reports:read',
    name: 'Read Reports',
    module: 'reports',
    description: 'Access financial and operational reports',
  },
  // Settings
  {
    code: 'settings:update',
    name: 'Update Settings',
    module: 'settings',
    description: 'Manage tenant configuration, taxes, and integrations',
  },
  // Billing
  {
    code: 'billing:read',
    name: 'Read Billing',
    module: 'billing',
    description: 'View subscription plan and billing history',
  },
  {
    code: 'billing:update',
    name: 'Update Billing',
    module: 'billing',
    description: 'Change subscription plan and update payment details',
  },
];

/**
 * Permission codes assigned to each system role.
 * OWNER gets everything. MANAGER gets operational access. CASHIER gets POS-only access.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'dashboard:read',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'sales:read',
    'sales:create',
    'sales:update',
    'sales:void',
    'sales:refund',
    'payments:create',
    'payments:read',
    'customers:create',
    'customers:read',
    'customers:update',
    'customers:delete',
    'reports:read',
    'settings:update',
    'billing:read',
    'billing:update',
  ],
  MANAGER: [
    'dashboard:read',
    'users:create',
    'users:read',
    'users:update',
    'products:read',
    'products:create',
    'products:update',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'sales:read',
    'sales:create',
    'sales:update',
    'sales:refund',
    'payments:create',
    'payments:read',
    'customers:create',
    'customers:read',
    'customers:update',
    'reports:read',
  ],
  CASHIER: [
    'dashboard:read',
    'products:read',
    'sales:read',
    'sales:create',
    'payments:create',
    'payments:read',
    'customers:create',
    'customers:read',
  ],
};

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Authentication Service handling Tenant Registration, User Login,
 * Password Hashing, JWT Access Token generation, Hashed Refresh Token rotation, and Logout.
 */
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generates a bcrypt-hashed refresh token stored in the database.
   * Expiration: 7 days. Multi-device sessions supported.
   * Accepts a Prisma transaction client to run inside transactions.
   *
   * Returns: `<tokenId>.<rawSecret>` — the opaque string sent to the client.
   */
  private async createHashedRefreshToken(
    tenantId: string,
    userId: string,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const rawSecret = randomBytes(32).toString('hex');
    const hashedSecret = await bcrypt.hash(rawSecret, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const record = await prismaClient.refreshToken.create({
      data: {
        tenantId,
        userId,
        token: hashedSecret,
        expiresAt,
        isRevoked: false,
      },
    });

    return `${record.id}.${rawSecret}`;
  }

  /**
   * Seeds the 17 default permissions for a new tenant inside the registration transaction.
   * Creates Permission records and links them to each system role via RolePermission.
   *
   * @param tx - Active Prisma transaction client
   * @param tenantId - Tenant UUID
   * @param roles - Map of roleName → role record (must include id + name)
   */
  private async seedTenantPermissions(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roles: Record<string, { id: string; name: string }>,
  ): Promise<void> {
    // 1. Create all Permission records for this tenant
    const createdPermissions = await Promise.all(
      DEFAULT_PERMISSIONS.map((perm) =>
        tx.permission.create({
          data: {
            tenantId,
            code: `${tenantId}:${perm.code}`, // Namespaced per tenant to allow global + tenant-specific codes
            module: perm.module,
            action: perm.code.split(':')[1],
            description: perm.description,
          },
        }),
      ),
    );

    // Build a code → permission.id lookup map (strip tenantId prefix for matching)
    const permissionMap = new Map<string, string>(
      createdPermissions.map((p) => [
        p.code.replace(`${tenantId}:`, ''), // e.g. "users:create"
        p.id,
      ]),
    );

    // 2. Create RolePermission links for each system role
    for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roles[roleName];
      if (!role) continue;

      const rolePermData = permCodes
        .map((code) => {
          const permId = permissionMap.get(code);
          if (!permId) return null;
          return { roleId: role.id, permissionId: permId };
        })
        .filter(
          (entry): entry is { roleId: string; permissionId: string } =>
            entry !== null,
        );

      if (rolePermData.length > 0) {
        await tx.rolePermission.createMany({ data: rolePermData });
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Registers a new Tenant atomically.
   *
   * Creates in a single Prisma transaction:
   *  1. Tenant record
   *  2. Main Store
   *  3. Three system roles: OWNER (rank=100), MANAGER (rank=70), CASHIER (rank=10)
   *  4. 17 default Permission records scoped to the tenant
   *  5. RolePermission assignments per role
   *  6. First admin user assigned OWNER role
   *  7. UserStore assignment (user → main store)
   *  8. JWT Access Token + Hashed Refresh Token
   */
  async registerTenant(dto: RegisterTenantDto) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // ── 1. Create Tenant ──────────────────────────────────────────────────
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
        },
      });

      // ── 2. Create Main Store ──────────────────────────────────────────────
      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: `${dto.tenantName} Main Store`,
          code: 'STORE-001',
          isMain: true,
        },
      });

      // ── 3. Create all 3 system roles atomically ───────────────────────────
      const roleRecords = await Promise.all(
        SYSTEM_ROLES.map((roleDef) =>
          tx.role.create({
            data: {
              tenantId: tenant.id,
              name: roleDef.name,
              description: roleDef.description,
              rank: roleDef.rank,
              isSystem: true,
            },
          }),
        ),
      );

      // Build a roleName → role record lookup
      const roleMap = Object.fromEntries(
        roleRecords.map((r) => [r.name, { id: r.id, name: r.name }]),
      );

      // ── 4 & 5. Seed permissions and assign to roles ───────────────────────
      await this.seedTenantPermissions(tx, tenant.id, roleMap);

      // ── 5.5. Seed default UK VAT Rates ────────────────────────────────────
      const defaultTax = await tx.tax.create({
        data: {
          tenantId: tenant.id,
          name: 'UK VAT',
          code: 'UK_VAT',
          type: 'EXCLUSIVE',
          description: 'UK Value Added Tax',
        },
      });

      await tx.vatRate.createMany({
        data: [
          { tenantId: tenant.id, taxId: defaultTax.id, name: 'Standard VAT', percentage: 20, isDefault: true },
          { tenantId: tenant.id, taxId: defaultTax.id, name: 'Reduced VAT', percentage: 5, isDefault: false },
          { tenantId: tenant.id, taxId: defaultTax.id, name: 'Zero Rated', percentage: 0, isDefault: false },
        ],
      });

      // ── 6. Create first user as OWNER ─────────────────────────────────────
      const ownerRole = roleMap['OWNER'];
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: ownerRole.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      // ── 7. Assign user to main store ──────────────────────────────────────
      await tx.userStore.create({
        data: {
          userId: user.id,
          storeId: store.id,
          isDefault: true,
        },
      });

      // ── 8. Issue tokens ───────────────────────────────────────────────────
      const permissions = SYSTEM_ROLES.find(r => r.name === 'OWNER')
        ? ['dashboard:read', 'users:create', 'users:read', 'users:update', 'users:delete', 'products:read', 'products:create', 'products:update', 'products:delete', 'inventory:read', 'inventory:update', 'inventory:adjust', 'sales:read', 'sales:create', 'sales:update', 'sales:void', 'sales:refund', 'payments:create', 'payments:read', 'customers:create', 'customers:read', 'customers:update', 'customers:delete', 'reports:read', 'settings:update', 'billing:read', 'billing:update']
        : [];

      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        tenantId: tenant.id,
        roleId: ownerRole.id,
        roleName: 'OWNER',
        permissions,
      });

      const refreshToken = await this.createHashedRefreshToken(
        tenant.id,
        user.id,
        tx,
      );

      return {
        accessToken,
        refreshToken,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: ownerRole.id,
          role: 'OWNER',
          permissions,
        },
      };
    });
  }

  /**
   * Authenticates user credentials within a tenant context.
   * JWT payload is unchanged: { sub, email, tenantId, roleId }
   */
  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (!tenant || tenant.deletedAt || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials or inactive tenant');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: dto.email,
        deletedAt: null,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.createLog({
      tenantId: tenant.id,
      userId: user.id,
      action: 'LOGIN',
      table: 'auth',
      recordId: user.id,
      newValue: { email: user.email },
    });

    const permissions =
      user.role?.rolePermissions.map((rp) =>
        rp.permission.code.replace(`${tenant.id}:`, ''),
      ) ?? [];

    // JWT payload enriched with roleName and permissions
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      roleId: user.roleId,
      roleName: user.role?.name || '',
      permissions,
    });

    const refreshToken = await this.createHashedRefreshToken(
      tenant.id,
      user.id,
    );

    return {
      accessToken,
      refreshToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        role: user.role?.name || '',
        permissions,
      },
    };
  }

  /**
   * Rotates refresh token: revokes old token, issues new access + refresh token pair.
   */
  async refreshToken(dto: RefreshTokenDto) {
    const parts = dto.refreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const [tokenId, rawSecret] = parts;

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: { user: true, tenant: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const isMatch = await bcrypt.compare(rawSecret, tokenRecord.token);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token secret');
    }

    const user = tokenRecord.user;
    const tenant = tokenRecord.tenant;

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('Associated user account is inactive');
    }

    if (!tenant || tenant.status !== 'ACTIVE' || tenant.deletedAt) {
      throw new UnauthorizedException(
        'Associated tenant organization is inactive',
      );
    }

    // Token Rotation — revoke current token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const newAccessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      roleId: user.roleId,
    });

    const newRefreshToken = await this.createHashedRefreshToken(
      tenant.id,
      user.id,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revokes the user's refresh token, invalidating their current session.
   */
  async logout(userId: string, tenantId: string, dto: LogoutDto) {
    const parts = dto.refreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const [tokenId, rawSecret] = parts;

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    if (
      tokenRecord &&
      tokenRecord.userId === userId &&
      tokenRecord.tenantId === tenantId
    ) {
      const isMatch = await bcrypt.compare(rawSecret, tokenRecord.token);
      if (isMatch) {
        await this.prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { isRevoked: true },
        });
      }
    }

    await this.auditService.createLog({
      tenantId,
      userId,
      action: 'LOGOUT',
      table: 'auth',
      recordId: userId,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Returns the authenticated user's full profile including role, permissions,
   * tenant context, and assigned store list.
   */
  async getProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: true,
            currency: true,
          },
        },
        userStores: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User profile not found');

    // Strip tenant-namespaced prefix from permission codes before returning
    const permissions =
      user.role?.rolePermissions.map((rp) =>
        rp.permission.code.replace(`${tenantId}:`, ''),
      ) || [];

    const stores = user.userStores.map((us) => ({
      id: us.store.id,
      name: us.store.name,
      code: us.store.code,
      isMain: us.store.isMain,
      isDefault: us.isDefault,
    }));

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      tenant: user.tenant,
      role: {
        id: user.role?.id,
        name: user.role?.name,
        description: user.role?.description,
      },
      permissions,
      stores,
    };
  }
}
