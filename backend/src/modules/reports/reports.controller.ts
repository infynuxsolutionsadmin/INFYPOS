import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';

@ApiTags('Reporting & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Overview of business metrics, sale statuses, and low stock counts' })
  @ApiResponse({ status: 200, description: 'Overview counters returned successfully.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('dashboard')
  async getDashboard(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getDashboard(tenantId, query);
  }

  @ApiOperation({ summary: 'Periodic revenue summaries comparison (Today vs Yesterday vs Month)' })
  @ApiResponse({ status: 200, description: 'Period summaries returned successfully.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('sales/summary')
  async getSalesSummary(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getSalesSummary(tenantId, query);
  }

  @ApiOperation({ summary: 'Hourly transaction distribution metrics' })
  @ApiResponse({ status: 200, description: 'Hourly metrics list returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('sales/hourly')
  async getSalesHourly(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getSalesHourly(tenantId, query);
  }

  @ApiOperation({ summary: 'Daily transaction summary records list' })
  @ApiResponse({ status: 200, description: 'Daily summary list returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('sales/daily')
  async getSalesDaily(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getSalesDaily(tenantId, query);
  }

  @ApiOperation({ summary: 'Top 10 highest selling catalog items list' })
  @ApiResponse({ status: 200, description: 'Top selling list returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('products/top-selling')
  async getTopSellingProducts(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getTopSellingProducts(tenantId, query);
  }

  @ApiOperation({ summary: 'Category revenue and items sold distribution' })
  @ApiResponse({ status: 200, description: 'Category statistics list returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('categories')
  async getCategoryReports(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getCategoryReports(tenantId, query);
  }

  @ApiOperation({ summary: 'Breakdown percentages for CASH, CARD, and UPI splits' })
  @ApiResponse({ status: 200, description: 'Payments method breakdowns returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('payments')
  async getPaymentsBreakdown(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getPaymentsBreakdown(tenantId, query);
  }

  @ApiOperation({ summary: 'VAT collected and taxable sales grouped by tax band' })
  @ApiResponse({ status: 200, description: 'UK VAT collected details returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('vat')
  async getVatReports(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getVatReports(tenantId, query);
  }

  @ApiOperation({ summary: 'Inventory value, stock levels, and asset valuations' })
  @ApiResponse({ status: 200, description: 'Asset valuations analytics returned.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('inventory')
  async getInventoryAnalytics(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getInventoryAnalytics(tenantId, query);
  }

  @ApiOperation({ summary: 'Loyalty spend, top buyers, and returning ratios analytics' })
  @ApiResponse({ status: 200, description: 'Customer analytics returned successfully.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('reports:read')
  @Get('customers')
  async getCustomersAnalytics(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getCustomersAnalytics(tenantId, query);
  }

  @ApiOperation({ summary: 'Category product distribution counts summary' })
  @ApiResponse({ status: 200, description: 'Category product count breakdown returned.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('reports:read')
  @Get('category-summary')
  async getCategorySummary(@GetUser('tenantId') tenantId: string) {
    return this.reportsService.getCategorySummary(tenantId);
  }

  @ApiOperation({ summary: 'Stock status inventory level metrics summary' })
  @ApiResponse({ status: 200, description: 'Inventory stock level status breakdown returned.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('reports:read')
  @Get('inventory-summary')
  async getInventorySummary(@GetUser('tenantId') tenantId: string) {
    return this.reportsService.getInventorySummary(tenantId);
  }

  @ApiOperation({ summary: 'Store stock count overview summary' })
  @ApiResponse({ status: 200, description: 'Store stock list returned.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('reports:read')
  @Get('store-summary')
  async getStoreSummary(@GetUser('tenantId') tenantId: string) {
    return this.reportsService.getStoreSummary(tenantId);
  }

  @ApiOperation({ summary: 'Recent activity logs stream' })
  @ApiResponse({ status: 200, description: 'Activity logs list returned.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('reports:read')
  @Get('activity')
  async getActivity(@GetUser('tenantId') tenantId: string) {
    return this.reportsService.getActivity(tenantId);
  }
}
