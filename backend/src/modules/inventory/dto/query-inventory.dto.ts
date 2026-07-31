import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InventoryMovementType } from '@prisma/client';

export class QueryInventoryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed).', example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Records per page. Max 100.', example: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by store UUID.', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by product UUID.', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by product name or SKU (case-insensitive).', example: 'laptop' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Return only items at or below reorder level.', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  lowStock?: boolean;

  @ApiPropertyOptional({ description: 'Return only items with zero current stock.', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  outOfStock?: boolean;
}

export class QueryMovementsDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed).', example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Records per page. Max 100.', example: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by store UUID.', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by product UUID.', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by movement type.', enum: InventoryMovementType })
  @IsEnum(InventoryMovementType)
  @IsOptional()
  type?: InventoryMovementType;

  @ApiPropertyOptional({ description: 'Filter movements from this date (ISO 8601).', example: '2026-07-01' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter movements up to this date (ISO 8601).', example: '2026-07-31' })
  @IsString()
  @IsOptional()
  dateTo?: string;
}
