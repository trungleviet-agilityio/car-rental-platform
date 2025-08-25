/**
 * Auth Controller - Simple POC implementation
 */

import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InitiateOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { SignUpDto, ConfirmSignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/initiate')
  @ApiOperation({ summary: 'Initiate OTP authentication' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number format' })
  async initiateOtpAuth(@Body() body: InitiateOtpDto) {
    return this.authService.initiateOtpAuth(body.phoneNumber);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP code or phone number' })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.phoneNumber, body.code);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up with email and password' })
  @ApiResponse({ status: 200, description: 'Sign up initiated' })
  @ApiResponse({ status: 400, description: 'Invalid email, password, or phone number' })
  async signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body.email, body.password, body.phone);
  }

  @Post('signup/confirm')
  @ApiOperation({ summary: 'Confirm sign up with code' })
  @ApiResponse({ status: 200, description: 'Sign up confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid confirmation code' })
  async confirmSignUp(@Body() body: ConfirmSignUpDto) {
    return this.authService.confirmSignUp(body.email, body.code);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Sign in successful' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body.email, body.password);
  }
}
