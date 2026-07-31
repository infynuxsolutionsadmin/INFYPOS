import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO for creating a custom role within a tenant organization.
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name for this role within the tenant',
    example: 'SUPERVISOR',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Human-readable description of the role responsibilities',
    example: 'Senior supervisor with inventory access',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Role rank (1–99). Must be lower than your own rank. Higher rank = higher authority. ' +
      'System roles: OWNER=100, MANAGER=70, CASHIER=10.',
    example: 50,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  rank?: number;
}
