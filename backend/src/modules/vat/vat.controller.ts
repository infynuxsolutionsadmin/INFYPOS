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
import { CreateVatRateDto } from './dto/create-vat-rate.dto';
import { UpdateVatRateDto } from './dto/update-vat-rate.dto';
import { VatService } from './vat.service';

@ApiTags('VAT Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('vat/rates')
export class VatController {
  constructor(private readonly vatService: VatService) {}

  @ApiOperation({
    summary: 'Register a new VAT rate',
    description: 'Registers a tenant-isolated VAT rate.',
  })
  @ApiResponse({ status: 201, description: 'VAT rate registered successfully.' })
  @Roles('OWNER')
  @Permissions('settings:update')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateVatRateDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vatService.create(tenantId, userId, dto, ipAddress, userAgent);
  }

  @ApiOperation({
    summary: 'List all VAT rates',
    description: 'Returns all active VAT rates under the tenant context.',
  })
  @ApiResponse({ status: 200, description: 'VAT rates retrieved successfully.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('products:read')
  @Get()
  async findAll(@GetUser('tenantId') tenantId: string) {
    return this.vatService.findAll(tenantId);
  }

  @ApiOperation({
    summary: 'Get details of a VAT rate',
  })
  @ApiParam({ name: 'id', description: 'VAT rate UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'VAT rate details retrieved successfully.' })
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Permissions('products:read')
  @Get(':id')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.vatService.findOne(tenantId, id);
  }

  @ApiOperation({
    summary: 'Update VAT rate configuration',
  })
  @ApiParam({ name: 'id', description: 'VAT rate UUID to modify', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'VAT rate updated successfully.' })
  @Roles('OWNER')
  @Permissions('settings:update')
  @Patch(':id')
  async update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVatRateDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vatService.update(tenantId, userId, id, dto, ipAddress, userAgent);
  }

  @ApiOperation({
    summary: 'Soft-delete a VAT rate',
  })
  @ApiParam({ name: 'id', description: 'VAT rate UUID to remove', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'VAT rate soft-deleted successfully.' })
  @Roles('OWNER')
  @Permissions('settings:update')
  @Delete(':id')
  async remove(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.vatService.remove(tenantId, userId, id, ipAddress, userAgent);
  }
}
