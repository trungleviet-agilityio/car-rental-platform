/**
 * Update Car DTO
 */

import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class OwnerDto {
  @IsEmail() @IsOptional() email?: string;
  @IsPhoneNumber(undefined) @IsOptional() phone?: string;
}

export class UpdateCarDto {
  @IsString() @IsOptional()
  make?: string;

  @IsString() @IsOptional()
  model?: string;

  @IsInt() @IsOptional() @Min(1)
  seats?: number;

  @IsInt() @IsOptional() @IsPositive()
  pricePerDayCents?: number;

  @IsInt() @IsOptional() @Min(0)
  depositCents?: number;

  @ValidateNested() @Type(() => OwnerDto) @IsOptional()
  owner?: OwnerDto;
}
