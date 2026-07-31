import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

// ─── Item DTO ────────────────────────────────────────────────────────────────

export class CreateSaleItemDto {
  @ApiProperty({ description: 'Product UUID', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity to sell. Must be greater than 0.', example: 2 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Override unit price. If omitted, product.sellingPrice is used.',
    example: 49.99,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({
    description: 'Line-item discount amount (absolute value, not percentage).',
    example: 5.00,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'VAT rate UUID to apply. If omitted, product default VAT rate is used.',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  vatRateId?: string;
}

// ─── Payment DTO ─────────────────────────────────────────────────────────────

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment method.',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Amount tendered for this payment leg.', example: 150.00 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'External transaction reference (POS terminal ID, bank ref, etc.)',
    example: 'TXN-ABC123',
  })
  @IsString()
  @IsOptional()
  transactionRef?: string;
}

// ─── Sale DTO ─────────────────────────────────────────────────────────────────

export class CreateSaleDto {
  @ApiProperty({ description: 'Store UUID where the sale is being processed.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    description: 'Array of items being sold. At least one item is required.',
    type: [CreateSaleItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({
    description: 'Array of payment legs. Split payments are supported. Sum must equal sale total.',
    type: [CreatePaymentDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments: CreatePaymentDto[];

  @ApiPropertyOptional({ description: 'Customer UUID (optional — walk-in sales allowed).', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Discount record UUID to apply at sale level.', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  discountId?: string;

  @ApiPropertyOptional({ description: 'Optional notes or order reference attached to the sale.', example: 'Online order #1234' })
  @IsString()
  @IsOptional()
  notes?: string;
}
