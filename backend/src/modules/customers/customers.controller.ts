import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({
    summary: 'Register a new customer profile',
    description: 'Creates a tenant-isolated customer profile. Generates a unique customer code (CUST-000001) sequentially.',
  })
  @ApiResponse({ status: 201, description: 'Customer created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate email error.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('customers:create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateCustomerDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.customersService.create(tenantId, userId, dto, ipAddress, userAgent);
  }

  @ApiOperation({
    summary: 'List customers (paginated)',
    description: 'Returns a paginated list of customers. Supports search filters covering name, email, phone, and customer code.',
  })
  @ApiResponse({ status: 200, description: 'Customers list retrieved successfully.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('customers:read')
  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() query: QueryCustomerDto,
  ) {
    return this.customersService.findAll(tenantId, query);
  }

  @ApiOperation({
    summary: 'Get customer profile details',
    description: 'Retrieves a single customer record by ID.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Customer details retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('customers:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(tenantId, id);
  }

  @ApiOperation({
    summary: 'Update customer details',
    description: 'Updates properties of a customer profile. Enforces tenant-unique email checks.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID to modify', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('customers:update')
  @Patch(':id')
  async update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.customersService.update(tenantId, userId, id, dto, ipAddress, userAgent);
  }

  @ApiOperation({
    summary: 'Soft delete a customer',
    description: 'Marks a customer as deleted. Retains record inside database for audit history.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID to remove', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Customer soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Roles('OWNER', 'MANAGER')
  @Permissions('customers:delete')
  @Delete(':id')
  async remove(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.customersService.remove(tenantId, userId, id, ipAddress, userAgent);
  }
}
