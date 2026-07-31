import { ApiPropertyOptional } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Data Transfer Object for updating store details (partial update).
 */
export class UpdateStoreDto {
  @ApiPropertyOptional({
    description: 'Updated store name',
    example: 'Chennai Regional Hub',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated contact email address',
    example: 'chennai.hub@infynux.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated contact phone number',
    example: '+919876543211',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Primary street address (Line 1)',
    example: '456 OMR Road',
  })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Secondary street address (Line 2)',
    example: 'Phase 2, IT Corridor',
  })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Chennai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State / Province',
    example: 'Tamil Nadu',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'India',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal / ZIP code',
    example: '600096',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Timezone identifier',
    example: 'Asia/Kolkata',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'ISO 4217 Currency Code',
    example: 'INR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    enum: StoreStatus,
    description:
      'Operational status of the store (ACTIVE, INACTIVE, MAINTENANCE, DELETED)',
    example: StoreStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StoreStatus, { message: 'Invalid store status enum value' })
  status?: StoreStatus;

  @ApiPropertyOptional({
    description: 'Set as tenant main store',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
