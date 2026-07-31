import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Data Transfer Object for updating user account details within a Tenant
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Updated first name',
    example: 'Johnathan',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Updated last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Updated contact phone number',
    example: '+1987654321',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Account status (ACTIVE, INACTIVE, SUSPENDED)',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED',
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Updated Role UUID assigned to the user',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Role ID must be a valid UUID v4' })
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Updated list of Store UUIDs assigned to this user',
    example: ['b1fec99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'storeIds must be an array of UUIDs' })
  @IsUUID('4', { each: true, message: 'Each store ID must be a valid UUID v4' })
  storeIds?: string[];
}
