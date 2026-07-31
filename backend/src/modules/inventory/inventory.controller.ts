import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryInventoryDto, QueryMovementsDto } from './dto/query-inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── GET /inventory/movements ───────────────────────────────────────────────
  // Must be declared before :id to avoid route conflict

  @ApiOperation({
    summary: 'List inventory movements (paginated)',
    description:
      'Returns a paginated movement log covering SALE, RETURN, ADJUSTMENT, PURCHASE, DAMAGE, and TRANSFER events. Filterable by product, store, movement type, and date range.',
  })
  @ApiResponse({ status: 200, description: 'Movement log retrieved successfully.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('inventory:read')
  @Get('movements')
  async getMovements(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryMovementsDto,
  ) {
    return this.inventoryService.getMovements(tenantId, query);
  }

  // ── GET /inventory ─────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'List current stock levels (paginated)',
    description:
      'Returns paginated stock balances for all product-store combinations within the tenant. Includes computed fields: availableStock (currentStock - reservedStock), isLowStock, isOutOfStock. Supports filtering by store, product, search term, low-stock flag, and out-of-stock flag.',
  })
  @ApiResponse({ status: 200, description: 'Inventory list retrieved successfully.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('inventory:read')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryInventoryDto,
  ) {
    return this.inventoryService.findAll(tenantId, query);
  }

  // ── POST /inventory/adjust ─────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Adjust stock level manually',
    description:
      'Performs a manual stock adjustment inside an atomic transaction. Creates an InventoryMovement record and an audit log entry. Positive quantity adds stock; negative quantity removes stock. Returns 409 if the adjustment would cause negative stock (except for DAMAGE write-offs).',
  })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully.' })
  @ApiResponse({ status: 404, description: 'Product or store not found.' })
  @ApiResponse({ status: 409, description: 'Adjustment would result in negative stock.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('inventory:adjust')
  @Post('adjust')
  async adjustStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(tenantId, userId, dto);
  }

  // ── GET /inventory/:id ─────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Get single inventory record',
    description:
      'Returns the inventory record for a specific product-store pair, including computed availableStock, isLowStock, and isOutOfStock flags.',
  })
  @ApiParam({ name: 'id', description: 'Inventory record UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Inventory record retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Inventory record not found.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('inventory:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.inventoryService.findOne(tenantId, id);
  }
}
