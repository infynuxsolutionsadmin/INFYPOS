import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

/**
 * Service managing Store entities with multi-tenant isolation and role-based access scoping.
 */
@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generates the next sequential store code for a tenant in the format `STORE-001`, `STORE-002`, etc.
   */
  private async generateNextStoreCode(tenantId: string): Promise<string> {
    const stores = await this.prisma.store.findMany({
      where: { tenantId },
      select: { code: true },
    });

    let maxNum = 0;
    for (const store of stores) {
      const match = store.code.match(/^STORE-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const padded = nextNum.toString().padStart(3, '0');
    return `STORE-${padded}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Store Operations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates a new store for the tenant. Restricted to OWNER role.
   * Auto-generates store code if omitted. Manages main store uniqueness.
   */
  async create(tenantId: string, userRoleName: string, dto: CreateStoreDto) {
    if (userRoleName !== 'OWNER') {
      throw new ForbiddenException(
        'Access denied. Only tenant OWNER can create stores.',
      );
    }

    // Determine store code
    let storeCode = dto.code?.trim().toUpperCase();
    if (!storeCode) {
      storeCode = await this.generateNextStoreCode(tenantId);
    } else {
      // Validate code uniqueness within tenant
      const existing = await this.prisma.store.findFirst({
        where: { tenantId, code: storeCode, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(
          `Store code '${storeCode}' is already in use within this tenant`,
        );
      }
    }

    // Build unified address string for backward compatibility
    const address = [dto.addressLine1, dto.addressLine2]
      .filter(Boolean)
      .join(', ');

    return this.prisma.$transaction(async (tx) => {
      // If marking as main store, unset main status on all other stores in tenant
      if (dto.isMain) {
        await tx.store.updateMany({
          where: { tenantId, isMain: true },
          data: { isMain: false },
        });
      }

      return tx.store.create({
        data: {
          tenantId,
          name: dto.name,
          code: storeCode,
          address: address || null,
          addressLine1: dto.addressLine1 ?? null,
          addressLine2: dto.addressLine2 ?? null,
          city: dto.city ?? null,
          state: dto.state ?? null,
          country: dto.country ?? null,
          postalCode: dto.postalCode ?? null,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          timezone: dto.timezone ?? 'UTC',
          currency: dto.currency ?? 'USD',
          isMain: dto.isMain ?? false,
          status: StoreStatus.ACTIVE,
        },
      });
    });
  }

  /**
   * Returns a paginated list of stores.
   * - OWNER: Sees all non-deleted stores belonging to tenant.
   * - MANAGER / CASHIER: Sees ONLY assigned stores via user_stores table.
   */
  async findAll(
    tenantId: string,
    userId: string,
    userRoleName: string,
    query: QueryStoreDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Strictly typed Prisma StoreWhereInput
    const where: Prisma.StoreWhereInput = {
      tenantId,
      deletedAt: null,
    };

    // Scoping for non-OWNER roles (MANAGER, CASHIER): restrict to assigned stores
    if (userRoleName !== 'OWNER') {
      where.userStores = {
        some: {
          userId,
          deletedAt: null,
        },
      };
    }

    // Search filter across name, code, city, state, and email
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { state: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Returns details for a single store.
   * Enforces tenant boundary and store assignment for non-OWNER roles.
   */
  async findOne(
    tenantId: string,
    userId: string,
    userRoleName: string,
    id: string,
  ) {
    const store = await this.prisma.store.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!store) {
      throw new NotFoundException(
        'Store not found or does not belong to this tenant',
      );
    }

    // Non-OWNER roles can only access assigned stores
    if (userRoleName !== 'OWNER') {
      const isAssigned = await this.prisma.userStore.findFirst({
        where: {
          userId,
          storeId: id,
          deletedAt: null,
        },
      });

      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied. You are not assigned to this store.',
        );
      }
    }

    return store;
  }

  /**
   * Updates store details. Restricted to OWNER role.
   */
  async update(
    tenantId: string,
    userRoleName: string,
    id: string,
    dto: UpdateStoreDto,
  ) {
    if (userRoleName !== 'OWNER') {
      throw new ForbiddenException(
        'Access denied. Only tenant OWNER can update stores.',
      );
    }

    // Verify store exists within tenant
    await this.findOne(tenantId, '', 'OWNER', id);

    const address =
      dto.addressLine1 !== undefined || dto.addressLine2 !== undefined
        ? [dto.addressLine1, dto.addressLine2].filter(Boolean).join(', ')
        : undefined;

    return this.prisma.$transaction(async (tx) => {
      // If setting as main store, clear isMain on other stores
      if (dto.isMain) {
        await tx.store.updateMany({
          where: { tenantId, isMain: true, NOT: { id } },
          data: { isMain: false },
        });
      }

      return tx.store.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          address: address !== undefined ? address || null : undefined,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          postalCode: dto.postalCode,
          timezone: dto.timezone,
          currency: dto.currency,
          status: dto.status,
          isMain: dto.isMain,
        },
      });
    });
  }

  /**
   * Soft-deletes a store by setting deletedAt timestamp and status=DELETED.
   * Restricted to OWNER role. Never physically removes database rows.
   */
  async softDelete(tenantId: string, userRoleName: string, id: string) {
    if (userRoleName !== 'OWNER') {
      throw new ForbiddenException(
        'Access denied. Only tenant OWNER can delete stores.',
      );
    }

    await this.findOne(tenantId, '', 'OWNER', id);

    await this.prisma.store.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: StoreStatus.DELETED,
        isMain: false,
      },
    });

    return {
      success: true,
      message: 'Store soft-deleted successfully',
    };
  }
}
