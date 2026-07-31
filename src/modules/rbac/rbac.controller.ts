import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetTenant } from '../../common/decorators/get-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RbacService } from './rbac.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('roles')
  @RequirePermissions('roles:create')
  createRole(@GetTenant() tenantId: string, @Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(tenantId, dto);
  }

  @Get('roles')
  @RequirePermissions('roles:read')
  findAllRoles(@GetTenant() tenantId: string) {
    return this.rbacService.findAllRoles(tenantId);
  }

  @Get('roles/:id')
  @RequirePermissions('roles:read')
  findOneRole(@GetTenant() tenantId: string, @Param('id') id: string) {
    return this.rbacService.findOneRole(tenantId, id);
  }

  @Patch('roles/:id')
  @RequirePermissions('roles:update')
  updateRole(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(tenantId, id, dto);
  }

  @Delete('roles/:id')
  @RequirePermissions('roles:delete')
  removeRole(@GetTenant() tenantId: string, @Param('id') id: string) {
    return this.rbacService.softDeleteRole(tenantId, id);
  }
}
