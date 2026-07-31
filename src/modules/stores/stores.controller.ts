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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@GetTenant() tenantId: string, @Body() dto: CreateStoreDto) {
    return this.storesService.create(tenantId, dto);
  }

  @Get()
  findAll(@GetTenant() tenantId: string) {
    return this.storesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@GetTenant() tenantId: string, @Param('id') id: string) {
    return this.storesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@GetTenant() tenantId: string, @Param('id') id: string) {
    return this.storesService.softDelete(tenantId, id);
  }
}
