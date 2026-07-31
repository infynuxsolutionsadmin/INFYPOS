import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { StoreStatus } from '@prisma/client';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
