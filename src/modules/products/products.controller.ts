import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetTenant } from '../../common/decorators/get-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@GetTenant() tenantId: string) {
    return this.productsService.findAll(tenantId);
  }
}
