import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProductsService } from './modules/products/products.service';
import { CreateProductDto } from './modules/products/dto/create-product.dto';
import { ProductStatus } from '@prisma/client';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);

  const tenantId = '82517288-00d8-4d5a-9e29-508089fc061c'; // Tenant 'team'
  const dto: CreateProductDto = {
    name: 'Audit Test Product',
    sku: 'AUDIT-TEST-001',
    vatRateId: '00000000-0000-0000-0000-000000000000',
    costPrice: 10,
    sellingPrice: 15,
    minimumStock: 5,
    reorderLevel: 2,
    status: ProductStatus.ACTIVE,
    trackInventory: true,
  };

  console.log('Creating product...');
  try {
    const product = await productsService.create(tenantId, dto);
    console.log('Product created successfully:', product);
  } catch (err) {
    console.error('Error creating product:', err);
  }

  await app.close();
}

main();
