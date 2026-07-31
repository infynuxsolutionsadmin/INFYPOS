import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { VoidSaleDto } from './dto/void-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ── POST /sales ────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Process a new sale',
    description:
      'Creates a completed sale within a single atomic transaction. Validates store, products, inventory levels, and payment totals. Automatically decrements inventory, creates inventory movements, generates a receipt, and writes an audit log. Returns 409 if any item has insufficient stock.',
  })
  @ApiResponse({ status: 201, description: 'Sale processed successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error or payment total mismatch.' })
  @ApiResponse({ status: 404, description: 'Store, product, or customer not found.' })
  @ApiResponse({ status: 409, description: 'Insufficient stock — includes product details.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('sales:create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') cashierId: string,
    @Body() dto: CreateSaleDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.salesService.createSale(tenantId, cashierId, dto, ipAddress, userAgent);
  }

  // ── GET /sales/summary ─────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Revenue and transaction summary',
    description:
      'Returns SQL-aggregated revenue metrics: today, this week, this month, all-time total, average order value, and a breakdown by payment method. All values are computed directly in SQL — no JavaScript aggregation.',
  })
  @ApiQuery({ name: 'storeId', required: false, description: 'Filter by store UUID.' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (ISO 8601).', example: '2026-07-01' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (ISO 8601).', example: '2026-07-31' })
  @ApiResponse({ status: 200, description: 'Revenue summary retrieved successfully.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('sales:read')
  @Get('summary')
  async getSummary(
    @GetUser('tenantId') tenantId: string,
    @Query('storeId') storeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.salesService.getSummary(tenantId, storeId, dateFrom, dateTo);
  }

  // ── GET /sales ─────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'List sales (paginated)',
    description:
      'Returns a paginated list of sales for the authenticated tenant. Supports search by invoice/receipt number, filters by store, cashier, customer, status, and date range.',
  })
  @ApiResponse({ status: 200, description: 'Sales list retrieved successfully.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('sales:read')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QuerySaleDto,
  ) {
    return this.salesService.findAll(tenantId, query);
  }

  // ── GET /sales/:id ─────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Get full sale details',
    description:
      'Returns a single sale with all related data: store, cashier, customer, line items (with VAT), payments, and the structured receipt JSON.',
  })
  @ApiParam({ name: 'id', description: 'Sale UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sale details retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('sales:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(tenantId, id);
  }

  // ── POST /sales/:id/void ───────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Void a completed sale',
    description:
      'Voids a completed sale inside a single atomic transaction. Restores all inventory quantities, creates RETURN inventory movements, updates sale status to VOIDED, and writes a detailed audit log. Only OWNER can void. Returns 400 if the sale is already voided or cancelled.',
  })
  @ApiParam({ name: 'id', description: 'Sale UUID to void', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sale voided successfully. Inventory restored.' })
  @ApiResponse({ status: 400, description: 'Sale is already voided or cancelled.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  @Roles('OWNER')
  @Permissions('sales:void')
  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  async voidSale(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: VoidSaleDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.salesService.voidSale(tenantId, userId, id, dto, ipAddress, userAgent);
  }
}
