import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO for updating a custom role. All fields are optional (partial update).
 * System roles (OWNER, MANAGER, CASHIER) cannot be updated via this endpoint.
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'New name for the custom role',
    example: 'SENIOR_CASHIER',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of role responsibilities',
    example: 'Senior cashier with refund permissions',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated rank (1–99). Must remain lower than your own rank.',
    example: 15,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  rank?: number;
}
