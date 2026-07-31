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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

/**
 * Controller exposing Store Management endpoints with multi-tenant isolation and role access controls.
 *
 * Access Rules:
 * - OWNER: Full CRUD access across all stores in tenant.
 * - MANAGER: Read-only access restricted strictly to assigned stores.
 * - CASHIER: Read-only access restricted strictly to assigned stores.
 */
@ApiTags('Store Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /**
   * Creates a new store for the authenticated tenant.
   * Restricted to OWNER role. Store limits (max 5) are checked in service.
   */
  @ApiOperation({
    summary: 'Create Store',
    description:
      'Creates a new store and assigns it code-based configuration. ' +
      'Check limits: Starter/Standard plans limit store creation to 5 stores max. ' +
      'Requires JWT session authentication + OWNER role.',
  })
  @ApiResponse({ status: 201, description: 'Store created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid Bearer token.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — requires OWNER role.' })
  @ApiResponse({
    status: 409,
    description: 'Store code is already in use within this tenant.',
  })
  @Roles('OWNER')
  @Audit('CREATE', 'stores')
  @Post()
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('roleName') userRoleName: string,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.create(tenantId, userRoleName, dto);
  }

  /**
   * Lists stores with pagination and multi-field search.
   * OWNER sees all tenant stores; MANAGER/CASHIER see only assigned stores.
   */
  @ApiOperation({
    summary: 'List Stores (Paginated & Searchable)',
    description:
      'Returns a paginated list of stores belonging to the tenant. ' +
      'Supports search filtering across store name, store code, city, state, and email. ' +
      'OWNER can view all stores. MANAGER and CASHIER can view only assigned stores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of stores returned successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @GetUser('roleName') userRoleName: string,
    @Query() query: QueryStoreDto,
  ) {
    return this.storesService.findAll(tenantId, userId, userRoleName, query);
  }

  /**
   * Returns details for a single store.
   * MANAGER/CASHIER can only fetch store details for stores assigned to them.
   */
  @ApiOperation({
    summary: 'Get Store Details',
    description:
      'Fetches details for a specific store. ' +
      'Enforces tenant boundary — returns 404 if store belongs to another tenant. ' +
      'MANAGER and CASHIER receive 403 if they are not assigned to this store.',
  })
  @ApiResponse({
    status: 200,
    description: 'Store details returned successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — user not assigned to this store.',
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found or belongs to another tenant.',
  })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @GetUser('roleName') userRoleName: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.findOne(tenantId, userId, userRoleName, id);
  }

  /**
   * Updates store details. Restricted to OWNER role.
   */
  @ApiOperation({
    summary: 'Update Store',
    description:
      'Updates store configuration, address, status, or main store flag. ' +
      'Restricted to tenant OWNER role.',
  })
  @ApiResponse({ status: 200, description: 'Store updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires OWNER role.' })
  @ApiResponse({
    status: 404,
    description: 'Store not found or belongs to another tenant.',
  })
  @Roles('OWNER')
  @Audit('UPDATE', 'stores')
  @Patch(':id')
  async update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('roleName') userRoleName: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(tenantId, userRoleName, id, dto);
  }

  /**
   * Soft-deletes a store by setting deletedAt timestamp and status=DELETED.
   * Restricted to OWNER role. Never physically removes database rows.
   */
  @ApiOperation({
    summary: 'Delete Store (Soft Delete)',
    description:
      'Sets deletedAt timestamp and status=DELETED for the store. ' +
      'Never physically removes database rows. Restricted to tenant OWNER role.',
  })
  @ApiResponse({ status: 200, description: 'Store soft-deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires OWNER role.' })
  @ApiResponse({
    status: 404,
    description: 'Store not found or belongs to another tenant.',
  })
  @Roles('OWNER')
  @Audit('DELETE', 'stores')
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async remove(
    @GetUser('tenantId') tenantId: string,
    @GetUser('roleName') userRoleName: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.softDelete(tenantId, userRoleName, id);
  }
}
