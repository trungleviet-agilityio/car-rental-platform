/**
 * Create Booking DTO
 */

import { 
  IsISO8601, 
  IsInt, 
  IsNotEmpty, 
  IsOptional, 
  IsPositive, 
  IsString, 
  ValidateNested, 
  IsEmail, 
  IsPhoneNumber 
} from 'class-validator';
import { Type } from 'class-transformer';

class OwnerDto {
  @IsEmail() @IsOptional() email?: string;
  @IsPhoneNumber(undefined) @IsOptional() phone?: string;
}

export class CreateBookingDto {
  @IsString() @IsOptional()
  cognitoSub?: string;

  @IsString() @IsNotEmpty()
  carId!: string;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsInt() @IsPositive()
  totalPrice!: number;

  @ValidateNested() @Type(() => OwnerDto) @IsOptional()
  owner?: OwnerDto;
}
