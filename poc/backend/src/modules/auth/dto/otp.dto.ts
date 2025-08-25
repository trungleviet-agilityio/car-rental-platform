import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateOtpDto {
  @ApiProperty({
    description: 'Vietnamese phone number (e.g., +84901234567 or 0901234567)',
    example: '+84901234567'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+84|84|0)[0-9]{9}$/, {
    message: 'Phone number must be a valid Vietnamese phone number (e.g., +84901234567, 84901234567, or 0901234567)'
  })
  phoneNumber!: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Vietnamese phone number (e.g., +84901234567 or 0901234567)',
    example: '+84901234567'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+84|84|0)[0-9]{9}$/, {
    message: 'Phone number must be a valid Vietnamese phone number (e.g., +84901234567, 84901234567, or 0901234567)'
  })
  phoneNumber!: string;

  @ApiProperty({
    description: 'OTP code (6 digits)',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP code must be exactly 6 digits'
  })
  code!: string;
}
