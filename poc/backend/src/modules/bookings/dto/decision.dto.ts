/**
 * Booking Decision DTO
 */

import { IsIn, IsOptional, IsString, IsEmail, IsPhoneNumber } from 'class-validator';

class RenterDto {
  @IsEmail() @IsOptional() email?: string;
  @IsPhoneNumber(undefined) @IsOptional() phone?: string;
}

export class BookingDecisionDto {
  @IsString()
  bookingId!: string;

  @IsIn(['accepted', 'rejected'])
  decision!: 'accepted' | 'rejected';

  @IsOptional()
  renter?: RenterDto;
}
