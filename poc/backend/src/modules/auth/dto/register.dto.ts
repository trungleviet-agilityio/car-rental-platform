import { IsString, IsOptional } from 'class-validator';

export class RegisterOnboardingDto {
  @IsString() @IsOptional() username?: string;
  @IsString() @IsOptional() password?: string;
  @IsString() @IsOptional() phone_number?: string;
}
