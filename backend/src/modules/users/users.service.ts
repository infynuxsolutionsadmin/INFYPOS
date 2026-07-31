import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * User Management Service — enforces multi-tenant isolation, store-level access,
 * and role hierarchy via rank comparison. Never trusts tenantId from client.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Validates that the caller can manage a target role.
   * Rule: caller's role rank must be STRICTLY GREATER than the target role rank.
   * This prevents privilege escalation (e.g. MANAGER assigning OWNER role).
   *
   * @param callerRoleRank - Rank of the user performing the action (from JWT)
   * @param targetRoleId   - UUID of the role being assigned to the new/updated user
   * @param tenantId       - Caller's tenantId for tenant-scoped role lookup
   * @throws ForbiddenException if caller cannot assign the target role
   */
  private async assertRoleHierarchy(
    callerRoleRank: number,
    targetRoleId: string,
    tenantId: string,
  ): Promise<void> {
    const targetRole = await this.prisma.role.findFirst({
      where: {
        id: targetRoleId,
        deletedAt: null,
        OR: [{ tenantId }, { isSystem: true }],
      },
      select: { rank: true, name: true },
    });

    if (!targetRole) {
      throw new NotFoundException(
        'Specified role was not found in this tenant',
      );
    }

    if (callerRoleRank <= targetRole.rank) {
      throw new ForbiddenException(
        `Access denied. You cannot assign a role with equal or higher authority than your own (target: '${targetRole.name}').`,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD Operations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates a new user within the tenant.
   *
   * Enforces:
   * - Email uniqueness within tenant
   * - Role belongs to tenant or is a system role
   * - Role rank hierarchy: caller must outrank the assigned role
   * - Store IDs belong to the same tenant
   *
   * @param tenantId      - Caller's tenantId from JWT (never from request body)
   * @param callerRoleRank - Caller's role rank from JWT strategy
   * @param dto           - Validated create user payload
   */
  async create(tenantId: string, callerRoleRank: number, dto: CreateUserDto) {
    // 1. Email uniqueness within tenant
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email address is already in use within this tenant',
      );
    }

    // 2. Role hierarchy enforcement — never skip, never compare by name
    await this.assertRoleHierarchy(callerRoleRank, dto.roleId, tenantId);

    // 3. Validate store IDs belong to the caller's tenant
    if (dto.storeIds && dto.storeIds.length > 0) {
      const validCount = await this.prisma.store.count({
        where: { id: { in: dto.storeIds }, tenantId, deletedAt: null },
      });

      if (validCount !== dto.storeIds.length) {
        throw new NotFoundException(
          'One or more specified stores were not found in this tenant',
        );
      }
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5. Create user and store assignments atomically
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId,
          roleId: dto.roleId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      if (dto.storeIds && dto.storeIds.length > 0) {
        await tx.userStore.createMany({
          data: dto.storeIds.map((storeId, index) => ({
            userId: newUser.id,
            storeId,
            isDefault: index === 0,
          })),
        });
      }

      return newUser;
    });

    return this.findOne(tenantId, user.id);
  }

  /**
   * Returns all active users belonging to the authenticated tenant.
   * Automatically scoped to tenantId — no cross-tenant leakage possible.
   *
   * @param tenantId - Caller's tenantId from JWT
   */
  async findAll(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, rank: true, description: true },
        },
        userStores: {
          where: { deletedAt: null },
          select: {
            isDefault: true,
            store: {
              select: { id: true, name: true, code: true, isMain: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      stores: u.userStores.map((us) => ({
        ...us.store,
        isDefault: us.isDefault,
      })),
      userStores: undefined,
    }));
  }

  /**
   * Returns details for a specific user. Enforces strict tenant boundary.
   *
   * @param tenantId - Caller's tenantId from JWT
   * @param id       - Target user UUID
   */
  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, rank: true, description: true },
        },
        userStores: {
          where: { deletedAt: null },
          select: {
            isDefault: true,
            store: {
              select: { id: true, name: true, code: true, isMain: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found or does not belong to this tenant',
      );
    }

    return {
      ...user,
      stores: user.userStores.map((us) => ({
        ...us.store,
        isDefault: us.isDefault,
      })),
      userStores: undefined,
    };
  }

  /**
   * Updates user profile fields and/or store assignments within tenant boundary.
   * If a new roleId is provided, enforces rank hierarchy before applying.
   *
   * @param tenantId       - Caller's tenantId from JWT
   * @param callerRoleRank  - Caller's role rank from JWT strategy
   * @param id             - Target user UUID
   * @param dto            - Validated update payload
   */
  async update(
    tenantId: string,
    callerRoleRank: number,
    id: string,
    dto: UpdateUserDto,
  ) {
    // Verify user exists in this tenant
    await this.findOne(tenantId, id);

    // Role change hierarchy check
    if (dto.roleId) {
      await this.assertRoleHierarchy(callerRoleRank, dto.roleId, tenantId);
    }

    // Validate stores belong to tenant
    if (dto.storeIds && dto.storeIds.length > 0) {
      const validCount = await this.prisma.store.count({
        where: { id: { in: dto.storeIds }, tenantId, deletedAt: null },
      });

      if (validCount !== dto.storeIds.length) {
        throw new NotFoundException(
          'One or more specified stores were not found in this tenant',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: dto.status,
          roleId: dto.roleId,
        },
      });

      if (dto.storeIds !== undefined) {
        // Replace all store assignments atomically
        await tx.userStore.deleteMany({ where: { userId: id } });

        if (dto.storeIds.length > 0) {
          await tx.userStore.createMany({
            data: dto.storeIds.map((storeId, index) => ({
              userId: id,
              storeId,
              isDefault: index === 0,
            })),
          });
        }
      }
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Soft-deletes a user. Never physically removes database records.
   * Only OWNER-level callers should reach this via controller guard.
   *
   * @param tenantId - Caller's tenantId from JWT
   * @param id       - Target user UUID
   */
  async softDelete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
