import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VoidSaleDto {
  @ApiProperty({
    description: 'Mandatory reason for voiding this sale. Stored in audit log. Minimum 5 characters.',
    example: 'Customer changed mind before goods were dispatched.',
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;
}
