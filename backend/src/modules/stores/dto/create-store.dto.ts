import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Data Transfer Object for creating a new Store within a Tenant organization.
 */
export class CreateStoreDto {
  @ApiProperty({
    description: 'Name of the store',
    example: 'Chennai Main Store',
  })
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  name: string;

  @ApiPropertyOptional({
    description:
      'Unique store code within tenant. Auto-generated (e.g. STORE-001, STORE-002) if omitted.',
    example: 'STORE-002',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Store contact email address',
    example: 'chennai@infynux.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Store contact phone number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Primary street address (Line 1)',
    example: '123 Anna Salai',
  })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Secondary street address (Line 2 / Suite / Floor)',
    example: 'Suite 404, Tech Park',
  })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City where store is located',
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
    example: '600002',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description:
      'Timezone identifier (e.g., UTC, Asia/Kolkata, America/New_York)',
    example: 'Asia/Kolkata',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'ISO 4217 Currency Code (3 letters)',
    example: 'INR',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Mark as tenant main store',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
