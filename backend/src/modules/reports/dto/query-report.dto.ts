import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryReportDto {
  @ApiPropertyOptional({ description: 'Filter by start date (ISO 8601 string or date)', example: '2026-07-01' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO 8601 string or date)', example: '2026-07-31' })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by Store UUID', example: '8b6cd2fb-43b3-4a26-9db5-a28e2763dfa2' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by Cashier UUID', example: '2f31a2ed-96f3-4085-8ca2-17a78782a10b' })
  @IsUUID()
  @IsOptional()
  cashierId?: string;

  @ApiPropertyOptional({ description: 'Preset date filter (e.g. today, yesterday, 7days, 30days, month, year)', example: '30days' })
  @IsString()
  @IsOptional()
  preset?: string;
}
export default QueryReportDto;
