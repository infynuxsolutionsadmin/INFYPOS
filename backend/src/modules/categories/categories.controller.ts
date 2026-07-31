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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Category Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('products:create')
  @Audit('CREATE', 'categories')
  @Post()
  async create(
    @GetUser('tenantId') tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'List categories (Paginated & Filterable)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('products:read')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() query: CategoryQueryDto,
  ) {
    return this.categoriesService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('products:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Update a category by ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('products:update')
  @Audit('UPDATE', 'categories')
  @Patch(':id')
  async update(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @Roles('OWNER')
  @Permissions('products:delete')
  @Audit('DELETE', 'categories')
  @Delete(':id')
  async remove(
    @GetUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.softDelete(tenantId, id);
  }
}
