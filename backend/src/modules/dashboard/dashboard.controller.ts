import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Get dashboard counters overview' })
  @ApiResponse({ status: 200, description: 'Overview counts retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('dashboard:read')
  @Get('overview')
  async getOverview(@GetUser('tenantId') tenantId: string) {
    return this.dashboardService.getOverview(tenantId);
  }

  @ApiOperation({ summary: 'Get category inventory share distribution' })
  @ApiResponse({ status: 200, description: 'Category distribution retrieved successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('dashboard:read')
  @Get('category-distribution')
  async getCategoryDistribution(@GetUser('tenantId') tenantId: string) {
    return this.dashboardService.getCategoryDistribution(tenantId);
  }

  @ApiOperation({ summary: 'Get inventory stock status aggregation' })
  @ApiResponse({ status: 200, description: 'Inventory stock summary retrieved successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('dashboard:read')
  @Get('inventory-summary')
  async getInventorySummary(@GetUser('tenantId') tenantId: string) {
    return this.dashboardService.getInventorySummary(tenantId);
  }

  @ApiOperation({ summary: 'Get recent system activity log feed' })
  @ApiResponse({ status: 200, description: 'Recent activity logs retrieved successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('dashboard:read')
  @Get('recent-activity')
  async getRecentActivity(@GetUser('tenantId') tenantId: string) {
    return this.dashboardService.getRecentActivity(tenantId);
  }

  @ApiOperation({ summary: 'Get active low stock alert rows' })
  @ApiResponse({ status: 200, description: 'Low stock items list retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('dashboard:read')
  @Get('low-stock')
  async getLowStock(@GetUser('tenantId') tenantId: string) {
    return this.dashboardService.getLowStock(tenantId);
  }

  @ApiOperation({ summary: 'Get monthly sales performance data for current year' })
  @ApiResponse({ status: 200, description: 'Sales performance data retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('dashboard:read')
  @Get('sales-performance')
  async getSalesPerformance(@GetUser('tenantId') tenantId: string) {
    return this.dashboardService.getSalesPerformance(tenantId);
  }
}
