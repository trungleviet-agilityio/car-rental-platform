import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'password123'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long'
  })
  password!: string;

  @ApiProperty({
    description: 'Vietnamese phone number (optional)',
    example: '+84901234567',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+84|84|0)[0-9]{9}$/, {
    message: 'Phone number must be a valid Vietnamese phone number (e.g., +84901234567, 84901234567, or 0901234567)'
  })
  phone?: string;
}

export class ConfirmSignUpDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Confirmation code (6 digits)',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, {
    message: 'Confirmation code must be exactly 6 digits'
  })
  code!: string;
}
