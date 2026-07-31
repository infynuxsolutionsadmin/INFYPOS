import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object for Multi-Tenant Authentication (Login)
 */
export class LoginDto {
  /**
   * Registered user's email address
   */
  @ApiProperty({
    description: 'Registered user email address',
    example: 'admin@infynux.com',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  /**
   * Plaintext password submitted for authentication
   */
  @ApiProperty({
    description: 'Plaintext password submitted for verification',
    example: 'SuperSecurePassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  /**
   * Tenant slug identifying the target organization scope
   */
  @ApiProperty({
    description: 'Tenant slug identifier for multi-tenant isolation',
    example: 'infynux-retail',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tenant slug is required' })
  tenantSlug: string;
}
