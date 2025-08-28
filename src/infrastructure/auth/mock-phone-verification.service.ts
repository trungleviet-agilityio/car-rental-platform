/**
 * Mock Phone Verification Service
 * Simple implementation for development and testing
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  IPhoneVerificationService,
  PhoneVerificationResult,
  VerifyCodeResult,
} from '@/core/interfaces/auth/phone-verification.interface';

@Injectable()
export class MockPhoneVerificationService implements IPhoneVerificationService {
  private readonly logger = new Logger(MockPhoneVerificationService.name);

  // Mock database for storing verification codes
  private readonly verificationCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();

  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<PhoneVerificationResult> {
    this.logger.debug(`[MOCK] Sending verification code to ${phoneNumber}`);

    // Generate a simple mock code
    const mockCode = '1234';
    const mockVerificationSid = `mock_${Date.now()}`;

    // Store the mock verification code
    this.verificationCodes.set(phoneNumber, {
      code: mockCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    this.logger.log(
      `[MOCK] Verification code generated for ${phoneNumber}: ${mockCode}`,
    );

    return {
      success: true,
      verificationSid: mockVerificationSid,
      status: 'pending',
    };
  }

  async verifyCode(
    phoneNumber: string,
    code: string,
  ): Promise<VerifyCodeResult> {
    this.logger.debug(`[MOCK] Verifying code ${code} for ${phoneNumber}`);

    const storedVerification = this.verificationCodes.get(phoneNumber);

    if (!storedVerification) {
      return {
        success: false,
        valid: false,
        status: 'failed',
        errorMessage: 'No verification found for this phone number',
      };
    }

    // Check if expired
    if (storedVerification.expiresAt < new Date()) {
      this.verificationCodes.delete(phoneNumber);
      return {
        success: false,
        valid: false,
        status: 'expired',
        errorMessage: 'Verification code has expired',
      };
    }

    // Check if code matches
    const isValid = storedVerification.code === code;

    if (isValid) {
      // Remove the verification code after successful verification
      this.verificationCodes.delete(phoneNumber);
      this.logger.log(`[MOCK] Code verification successful for ${phoneNumber}`);
    } else {
      this.logger.warn(
        `[MOCK] Code verification failed for ${phoneNumber} - Invalid code`,
      );
    }

    return {
      success: true,
      valid: isValid,
      status: isValid ? 'approved' : 'failed',
      errorMessage: isValid ? undefined : 'Invalid verification code',
    };
  }

  async cancelVerification(
    verificationSid: string,
  ): Promise<{ success: boolean }> {
    this.logger.debug(`[MOCK] Cancelling verification ${verificationSid}`);
    return { success: true };
  }
}
