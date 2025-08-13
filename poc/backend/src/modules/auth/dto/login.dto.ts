import { IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class LoginActionDto {
  @IsIn(['initiate_auth','respond_to_challenge','password','otp_initiate','otp_verify'])
  action!: 'initiate_auth' | 'respond_to_challenge' | 'password' | 'otp_initiate' | 'otp_verify';
  @IsPhoneNumber(undefined) @IsOptional() phone_number?: string;
  @IsString() @IsOptional() session?: string;
  @IsString() @IsOptional() otp_code?: string;
  @IsString() @IsOptional() username?: string;
  @IsString() @IsOptional() password?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsIn(['email','sms']) @IsOptional() channel?: 'email' | 'sms';
}
