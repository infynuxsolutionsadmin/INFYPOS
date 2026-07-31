import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for Refreshing Access Token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid non-revoked refresh token issued during login/refresh',
    example: '550e8400-e29b-41d4-a716-446655440000.a1b2c3d4e5f6',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
