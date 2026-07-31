import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RbacService } from './rbac.service';

/**
 * RBAC Controller — manages roles and permissions within the tenant organization.
 * All endpoints require OWNER role. Guard chain: JwtAuthGuard → RolesGuard → PermissionsGuard.
 */
@ApiTags('RBAC — Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('OWNER')
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Roles
  // ──────────────────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Create Custom Role',
    description:
      'Creates a new custom role within the tenant. ' +
      'System roles (OWNER, MANAGER, CASHIER) are created automatically on registration. ' +
      'Requires OWNER role.',
  })
  @ApiResponse({ status: 201, description: 'Role created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — OWNER role required.' })
  @Post('roles')
  createRole(
    @GetUser('tenantId') tenantId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rbacService.createRole(tenantId, dto);
  }

  @ApiOperation({
    summary: 'List All Roles',
    description:
      'Returns all roles for this tenant (both system and custom) with their permission lists. ' +
      'Results ordered by rank descending. Requires OWNER role.',
  })
  @ApiResponse({ status: 200, description: 'Role list returned successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Get('roles')
  findAllRoles(@GetUser('tenantId') tenantId: string) {
    return this.rbacService.findAllRoles(tenantId);
  }

  @ApiOperation({
    summary: 'Get Role Details',
    description:
      'Returns a single role with its full permission list. Requires OWNER role.',
  })
  @ApiResponse({ status: 200, description: 'Role returned successfully.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Get('roles/:id')
  findOneRole(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rbacService.findOneRole(tenantId, id);
  }

  @ApiOperation({
    summary: 'Update Custom Role',
    description:
      'Updates a custom role name, description, or rank. ' +
      'System roles (OWNER, MANAGER, CASHIER) cannot be modified. Requires OWNER role.',
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  @ApiResponse({ status: 400, description: 'System roles cannot be modified.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Patch('roles/:id')
  updateRole(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(tenantId, id, dto);
  }

  @ApiOperation({
    summary: 'Delete Custom Role (Soft Delete)',
    description:
      'Soft-deletes a custom role. System roles cannot be deleted. Requires OWNER role.',
  })
  @ApiResponse({ status: 200, description: 'Role deleted successfully.' })
  @ApiResponse({ status: 400, description: 'System roles cannot be deleted.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Delete('roles/:id')
  removeRole(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rbacService.softDeleteRole(tenantId, id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Permissions
  // ──────────────────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'List All Permissions',
    description:
      'Returns all permission codes available within this tenant. ' +
      'Use these codes when building custom permission checks or UI. ' +
      'Requires OWNER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission list returned successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — OWNER role required.' })
  @Get('permissions')
  findAllPermissions(@GetUser('tenantId') tenantId: string) {
    return this.rbacService.findAllPermissions(tenantId);
  }
}
