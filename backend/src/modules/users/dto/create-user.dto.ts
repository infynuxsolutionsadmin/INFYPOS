import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

/**
 * Data Transfer Object for creating a new User within a Tenant organization
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Unique email address for the user within the tenant',
    example: 'john.doe@store.com',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    description:
      'Initial plain-text password for the user (minimum 6 characters)',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description: 'Role UUID assigned to the user',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'Role ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: string;

  @ApiPropertyOptional({
    description: 'Optional phone contact number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'List of Store UUIDs to assign to this user',
    example: ['b1fec99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'storeIds must be an array of UUIDs' })
  @IsUUID('4', { each: true, message: 'Each store ID must be a valid UUID v4' })
  storeIds?: string[];
}
