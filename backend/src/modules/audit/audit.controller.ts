import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService, QueryAuditLogParams } from './audit.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'Get tenant audit log list' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @Roles('OWNER')
  @Permissions('settings:update')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryAuditLogParams,
  ) {
    return this.auditService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Get detailed audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log details retrieved successfully' })
  @Roles('OWNER')
  @Permissions('settings:update')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.auditService.findOne(tenantId, id);
  }
}
