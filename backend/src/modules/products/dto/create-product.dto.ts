import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductPayloadDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product Stock Keeping Unit (unique per tenant)' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ description: 'Primary barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Selling unit (e.g. PCS, KG)' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: 'Purchase cost price' })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty({ description: 'Retail selling price' })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ description: 'Product status', enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Enable inventory tracking' })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Starting or current stock count' })
  @IsNumber()
  @IsOptional()
  minimumStock?: number; // Sourced as current stock in frontend implementation

  @ApiPropertyOptional({ description: 'Minimum stock alert trigger count' })
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @ApiProperty({ description: 'VAT rate UUID — every product must belong to a VAT category', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  vatRateId: string;
}
export class CreateProductDto extends CreateProductPayloadDto {}

