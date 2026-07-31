import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { InventoryMovementType } from '@prisma/client';

// Allowed types for a manual adjustment (subset — SALE/RETURN are system-only)
const MANUAL_ADJUSTMENT_TYPES = [
  InventoryMovementType.OPENING_STOCK,
  InventoryMovementType.ADJUSTMENT_ADD,
  InventoryMovementType.ADJUSTMENT_REMOVE,
  InventoryMovementType.DAMAGE,
] as const;

export type ManualAdjustmentType = (typeof MANUAL_ADJUSTMENT_TYPES)[number];

export class AdjustStockDto {
  @ApiProperty({ description: 'Product UUID to adjust.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Store UUID where stock should be adjusted.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    description: 'Quantity to adjust. Positive values add stock, negative values remove stock.',
    example: 10,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  quantity: number;

  @ApiProperty({
    description: 'Movement type for the adjustment.',
    enum: MANUAL_ADJUSTMENT_TYPES,
    example: InventoryMovementType.ADJUSTMENT_ADD,
  })
  @IsEnum(MANUAL_ADJUSTMENT_TYPES)
  type: ManualAdjustmentType;

  @ApiPropertyOptional({
    description: 'External reference number (e.g. purchase order number, GRN number).',
    example: 'PO-2026-0012',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Notes explaining the reason for the adjustment.',
    example: 'Counted 10 extra units during physical stock check.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
