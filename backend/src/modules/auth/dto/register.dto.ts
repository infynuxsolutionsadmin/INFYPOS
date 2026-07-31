import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Data Transfer Object for Tenant & Initial Admin User Registration
 */
export class RegisterTenantDto {
  /**
   * Official name of the Tenant / Business Organization
   */
  @ApiProperty({
    description: 'Name of the business / enterprise tenant',
    example: 'Infynux Retail Ltd',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tenant name is required' })
  tenantName: string;

  /**
   * Unique URL-friendly slug identifying the Tenant
   */
  @ApiProperty({
    description: 'Unique slug identifier for multi-tenant routing',
    example: 'infynux-retail',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tenant slug is required' })
  tenantSlug: string;

  /**
   * Initial Admin user's email address
   */
  @ApiProperty({
    description: 'Email address of the tenant administrator',
    example: 'admin@infynux.com',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  /**
   * Raw password string (hashed using bcrypt before database insertion)
   */
  @ApiProperty({
    description: 'Password for the admin user (minimum 6 characters)',
    example: 'SuperSecurePassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  /**
   * Admin user's first name
   */
  @ApiProperty({
    description: 'First name of the admin user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  /**
   * Admin user's last name
   */
  @ApiProperty({
    description: 'Last name of the admin user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  /**
   * Optional phone contact number
   */
  @ApiPropertyOptional({
    description: 'Optional phone number of the admin user',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
