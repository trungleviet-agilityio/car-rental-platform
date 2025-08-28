/**
 * Verify phone number DTOs
 * DTOs for verifying a phone number and sending a verification code
 **/

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyPhoneDto {
  @ApiProperty({
    description: 'Phone number that was used for verification',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)',
  })
  phoneNumber!: string;

  @ApiProperty({
    description: 'Verification code sent to the phone',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Length(4, 8, {
    message: 'Verification code must be between 4 and 8 characters',
  })
  @Matches(/^\d+$/, { message: 'Verification code must contain only numbers' })
  code!: string;
}

export class SendVerificationCodeDto {
  @ApiProperty({
    description: 'Phone number to send verification code to',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)',
  })
  phoneNumber!: string;
}

export class VerifyPhoneResponseDto {
  @ApiProperty({
    description: 'Whether the verification was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'JWT access token (only provided on successful verification)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    required: false,
  })
  expiresIn?: number;

  @ApiProperty({
    description: 'Next step in the onboarding process',
    example: 'PROFILE_COMPLETION',
  })
  nextStep!: string;

  @ApiProperty({
    description: 'Message for the user',
    example: 'Phone number verified successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'User information',
    required: false,
  })
  user?: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    profileCompleted: boolean;
    kycStatus: string;
  };
}
