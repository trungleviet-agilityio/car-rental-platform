import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long'
  })
  password!: string;
}
