/**
 * Twilio Verify Service
 * Implements IPhoneVerificationService for Twilio Verify service
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

import { 
  IPhoneVerificationService,
  PhoneVerificationResult,
  VerifyCodeResult,
} from '../../core/interfaces/auth/phone-verification.interface';
import { logError } from '@/shared/utils/error-handler';  

@Injectable()
export class TwilioVerifyService implements IPhoneVerificationService {
  private readonly logger = new Logger(TwilioVerifyService.name);
  private readonly twilioClient: Twilio;
  private readonly verifyServiceSid: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifyServiceSid = this.configService.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    ) || 'mock-verify-service-sid';

    if (!accountSid || !authToken || !this.verifyServiceSid) {
      throw new Error(
        'Twilio configuration is missing. Please check your environment variables.',
      );
    }

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<PhoneVerificationResult> {
    try {
      this.logger.debug(`Sending verification code to ${phoneNumber}`);

      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      this.logger.log(`Verification code sent successfully to ${phoneNumber}`, {
        verificationSid: verification.sid,
        status: verification.status,
      });

      return {
        success: true,
        verificationSid: verification.sid,
        status: verification.status,
      };
    } catch (error) {
      logError(error, `Failed to send verification code to ${phoneNumber}`);

      // Handle specific Twilio errors (cast to any to access Twilio-specific properties)
      const twilioError = error as any;
      if (twilioError?.code === 20003) {
        return {
          success: false,
          status: 'failed',
          errorMessage:
            'Authentication failed. Please check Twilio credentials.',
        };
      }

      if (twilioError?.code === 20404) {
        return {
          success: false,
          status: 'failed',
          errorMessage: 'Invalid phone number format.',
        };
      }

      if (twilioError?.code === 20429) {
        return {
          success: false,
          status: 'rate_limited',
          errorMessage:
            'Too many verification attempts. Please try again later.',
        };
      }

      if (twilioError?.code === 60203) {
        return {
          success: false,
          status: 'failed',
          errorMessage:
            'Maximum verification attempts reached for this phone number.',
        };
      }

      return {
        success: false,
        status: 'failed',
        errorMessage: 'Failed to send verification code. Please try again.',
      };
    }
  }

  async verifyCode(
    phoneNumber: string,
    code: string,
  ): Promise<VerifyCodeResult> {
    try {
      this.logger.debug(`Verifying code for ${phoneNumber}`);

      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      const isValid = verificationCheck.status === 'approved';

      this.logger.log(
        `Code verification ${isValid ? 'successful' : 'failed'} for ${phoneNumber}`,
        {
          status: verificationCheck.status,
          valid: isValid,
        },
      );

      return {
        success: true,
        valid: isValid,
        status: verificationCheck.status,
      };
    } catch (error) {
      logError(error, `Failed to verify code for ${phoneNumber}`);

      // Handle specific Twilio errors (cast to any to access Twilio-specific properties)
      const twilioError = error as any;
      if (twilioError?.code === 20404) {
        return {
          success: false,
          valid: false,
          status: 'failed',
          errorMessage: 'Invalid verification code or phone number.',
        };
      }

      if (twilioError?.code === 60202) {
        return {
          success: false,
          valid: false,
          status: 'expired',
          errorMessage:
            'Verification code has expired. Please request a new code.',
        };
      }

      if (twilioError?.code === 60200) {
        return {
          success: false,
          valid: false,
          status: 'failed',
          errorMessage: 'Invalid verification code.',
        };
      }

      throw new InternalServerErrorException(
        'Verification service temporarily unavailable',
      );
    }
  }

  async cancelVerification(
    verificationSid: string,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.debug(`Cancelling verification ${verificationSid}`);

      await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications(verificationSid)
        .update({ status: 'canceled' });

      this.logger.log(`Verification ${verificationSid} cancelled successfully`);

      return { success: true };
    } catch (error) {
      logError(error, `Failed to cancel verification ${verificationSid}`);

      return { success: false };
    }
  }

  /**
   * Health check for Twilio service
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Test by fetching the verification service
      await this.twilioClient.verify.v2.services(this.verifyServiceSid).fetch();

      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Twilio health check failed', error);
      throw new Error('Twilio service unavailable');
    }
  }
}
