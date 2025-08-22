/**
 * Create Car DTO
 */

import {
  IsInt,
  IsNotEmpty,
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

export class CreateCarDto {
  @IsString() @IsNotEmpty()
  make!: string;

  @IsString() @IsNotEmpty()
  model!: string;

  @IsInt() @Min(1)
  seats!: number;

  @IsInt() @IsPositive()
  pricePerDayCents!: number;

  @IsInt() @IsOptional() @Min(0)
  depositCents?: number;

  @ValidateNested() @Type(() => OwnerDto) @IsOptional()
  owner?: OwnerDto;
}
