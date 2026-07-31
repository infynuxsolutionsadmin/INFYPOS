import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

import { Audit } from '../../common/decorators/audit.decorator';

/**
 * User Management Controller — OWNER and MANAGER can list/create/update users.
 * Only OWNER can delete users. Role hierarchy is enforced in the service layer via rank.
 *
 * Guard chain: JwtAuthGuard → RolesGuard → PermissionsGuard
 */
@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('OWNER', 'MANAGER')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user within the authenticated tenant.
   * Role hierarchy enforced in service: caller rank > target role rank.
   * OWNER can create MANAGER or CASHIER. MANAGER can only create CASHIER.
   */
  @ApiOperation({
    summary: 'Create User',
    description:
      'Creates a new user within the authenticated tenant. ' +
      'Role hierarchy is enforced: you can only assign roles with lower rank than your own. ' +
      'OWNER (rank 100) can create MANAGER (70) or CASHIER (10). ' +
      'MANAGER (rank 70) can only create CASHIER (10). ' +
      'Requires OWNER or MANAGER role + users:create permission.',
  })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden — insufficient role or permission, or role hierarchy violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Specified role or store not found in this tenant.',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use within this tenant.',
  })
  @Permissions('users:create')
  @Audit('CREATE', 'users')
  @Post()
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('roleRank') callerRoleRank: number,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(tenantId, callerRoleRank, dto);
  }

  /**
   * Returns all active users within the authenticated tenant.
   * Automatically scoped — no cross-tenant data can be returned.
   */
  @ApiOperation({
    summary: 'List Tenant Users',
    description:
      'Returns all active users belonging to the authenticated tenant. ' +
      'Password hashes are never included in responses. ' +
      'Requires OWNER or MANAGER role + users:read permission.',
  })
  @ApiResponse({ status: 200, description: 'User list returned successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Permissions('users:read')
  @Get()
  async findAll(@GetUser('tenantId') tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  /**
   * Returns details for a single user within the authenticated tenant.
   * Returns 404 if user belongs to another tenant.
   */
  @ApiOperation({
    summary: 'Get User Details',
    description:
      'Fetches single user details including role and assigned stores. ' +
      'Enforces strict tenant boundary — returns 404 if user is in another tenant. ' +
      'Requires OWNER or MANAGER role + users:read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or belongs to another tenant.',
  })
  @Permissions('users:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(tenantId, id);
  }

  /**
   * Updates a user's profile, role, or store assignments.
   * Role change is subject to rank hierarchy validation.
   */
  @ApiOperation({
    summary: 'Update User',
    description:
      'Updates profile, status, role, or store assignments. ' +
      'Role changes are subject to hierarchy: caller must outrank the new role. ' +
      'Requires OWNER or MANAGER role + users:update permission.',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — role hierarchy violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or belongs to another tenant.',
  })
  @Permissions('users:update')
  @Audit('UPDATE', 'users')
  @Patch(':id')
  async update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('roleRank') callerRoleRank: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, callerRoleRank, id, dto);
  }

  /**
   * Soft-deletes a user. Sets deletedAt and status=DELETED.
   * Records are never physically removed from the database.
   * Restricted to OWNER role only.
   */
  @ApiOperation({
    summary: 'Delete User (Soft Delete)',
    description:
      'Sets deletedAt timestamp and status=DELETED. Never physically removes records. ' +
      'Restricted to OWNER role only + users:delete permission.',
  })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden — OWNER role required.' })
  @ApiResponse({
    status: 404,
    description: 'User not found or belongs to another tenant.',
  })
  @Roles('OWNER')
  @Permissions('users:delete')
  @Audit('DELETE', 'users')
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async remove(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.softDelete(tenantId, id);
  }
}
