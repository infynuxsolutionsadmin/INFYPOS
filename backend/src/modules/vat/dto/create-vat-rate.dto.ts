import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateVatRateDto {
  @ApiProperty({ description: 'The tax group parent ID', example: 'd3b07384-d113-4c9f-a89c-0c8402c48ac1' })
  @IsUUID()
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({ description: 'Display name of the VAT rate', example: 'Standard Rate (20%)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tax percentage value', example: 20.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  percentage: number;

  @ApiPropertyOptional({ description: 'Declare as default VAT rate for product profiles', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
