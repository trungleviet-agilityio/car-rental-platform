import { IsIn, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class LoginActionDto {
  @IsIn(['initiate_auth','respond_to_challenge','password'])
  action!: 'initiate_auth' | 'respond_to_challenge' | 'password';
  @IsPhoneNumber('SG') @IsOptional() phone_number?: string;
  @IsString() @IsOptional() session?: string;
  @IsString() @IsOptional() otp_code?: string;
  @IsString() @IsOptional() username?: string;
  @IsString() @IsOptional() password?: string;
}
