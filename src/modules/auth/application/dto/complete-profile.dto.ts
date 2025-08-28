import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  Matches,
  Length,
} from 'class-validator';
import { UserRole } from '@/shared/types';

export class CompleteProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName!: string;

  @ApiProperty({
    description: 'Date of birth in ISO format',
    example: '1990-01-15',
  })
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth!: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  address!: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city!: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
  })
  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  @MinLength(2, { message: 'State must be at least 2 characters long' })
  @MaxLength(100, { message: 'State must not exceed 100 characters' })
  state!: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Postal code is required' })
  @Matches(/^[A-Za-z0-9\s-]{3,20}$/, {
    message: 'Please provide a valid postal code',
  })
  postalCode!: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @Length(2, 2, { message: 'Country code must be exactly 2 characters' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country code must be in ISO format (e.g., US, CA, GB)',
  })
  country!: string;

  @ApiProperty({
    description: 'Driver license number',
    example: 'D123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5, {
    message: 'Driver license must be at least 5 characters long',
  })
  @MaxLength(50, { message: 'Driver license must not exceed 50 characters' })
  driverLicense?: string;

  @ApiProperty({
    description: 'User role preference',
    enum: UserRole,
    example: UserRole.RENTER,
    default: UserRole.RENTER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;
}

export class CompleteProfileResponseDto {
  @ApiProperty({
    description: 'Whether profile completion was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Next step in the onboarding process',
    example: 'KYC_UPLOAD',
  })
  nextStep!: string;

  @ApiProperty({
    description: 'Message for the user',
    example:
      'Profile completed successfully. Please upload your KYC documents.',
  })
  message!: string;

  @ApiProperty({
    description: 'Updated user information',
  })
  user!: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    profileCompleted: boolean;
    kycStatus: string;
    role: string;
  };
}
