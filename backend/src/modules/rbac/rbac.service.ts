import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/**
 * RBAC Service — manages Role and Permission resources within a tenant.
 * All queries are automatically scoped to the caller's tenantId.
 */
@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Roles
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates a custom role within the tenant.
   * Custom roles have isSystem=false and can be assigned a rank by the OWNER.
   */
  async createRole(tenantId: string, dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rank: dto.rank ?? 0,
        tenantId,
        isSystem: false,
      },
    });
  }

  /**
   * Returns all roles visible to this tenant: both tenant-specific and system roles.
   * Includes full permission list for each role.
   */
  async findAllRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: {
        OR: [{ tenantId }, { isSystem: true }],
        deletedAt: null,
      },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                code: true,
                module: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { rank: 'desc' },
    });

    // Strip the tenant-namespace prefix from permission codes before returning
    return roles.map((role) => ({
      ...role,
      rolePermissions: role.rolePermissions.map((rp) => ({
        ...rp,
        permission: {
          ...rp.permission,
          code: rp.permission.code.replace(`${tenantId}:`, ''),
        },
      })),
    }));
  }

  /**
   * Returns a single role with permissions. Enforces tenant boundary.
   */
  async findOneRole(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { isSystem: true }],
        deletedAt: null,
      },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                code: true,
                module: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!role) throw new NotFoundException('Role not found');

    return {
      ...role,
      rolePermissions: role.rolePermissions.map((rp) => ({
        ...rp,
        permission: {
          ...rp.permission,
          code: rp.permission.code.replace(`${tenantId}:`, ''),
        },
      })),
    };
  }

  /**
   * Updates a custom role's name, description, or rank.
   * System roles (isSystem=true) cannot be modified.
   */
  async updateRole(tenantId: string, id: string, dto: UpdateRoleDto) {
    const role = await this.findOneRole(tenantId, id);

    if (role.isSystem) {
      throw new BadRequestException(
        'System roles cannot be modified. Create a custom role instead.',
      );
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        rank: dto.rank,
      },
    });
  }

  /**
   * Soft-deletes a custom role. System roles cannot be deleted.
   */
  async softDeleteRole(tenantId: string, id: string) {
    const role = await this.findOneRole(tenantId, id);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted.');
    }

    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Permissions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns all permissions available within the tenant.
   * Strips the tenant-namespace prefix from codes for clean output.
   */
  async findAllPermissions(tenantId: string) {
    const permissions = await this.prisma.permission.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        module: true,
        action: true,
        description: true,
        createdAt: true,
      },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((p) => ({
      ...p,
      code: p.code.replace(`${tenantId}:`, ''),
    }));
  }
}
