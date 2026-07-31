import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for User Logout
 */
export class LogoutDto {
  @ApiProperty({
    description: 'Active refresh token to be revoked upon logout',
    example: '550e8400-e29b-41d4-a716-446655440000.a1b2c3d4e5f6',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required for logout' })
  refreshToken: string;
}
