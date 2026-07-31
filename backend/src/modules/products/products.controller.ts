import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Product Catalog Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('products:create')
  @Audit('CREATE', 'products')
  @Post()
  async create(
    @GetUser('tenantId') tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'List products (Paginated & Filterable)' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('products:read')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('products:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('products:update')
  @Audit('UPDATE', 'products')
  @Patch(':id')
  async update(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @Roles('OWNER')
  @Permissions('products:delete')
  @Audit('DELETE', 'products')
  @Delete(':id')
  async remove(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.softDelete(tenantId, id);
  }
}
