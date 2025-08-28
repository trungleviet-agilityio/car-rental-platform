/**
 * Phone Verification Service Interface
 */

export interface PhoneVerificationResult {
  success: boolean;
  verificationSid?: string;
  status: string;
  errorMessage?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  valid: boolean;
  status: string;
  errorMessage?: string;
}

export interface IPhoneVerificationService {
  /**
   * Send verification code to phone number
   * @param phoneNumber Phone number in international format
   * @returns Promise with verification result
   */
  sendVerificationCode(phoneNumber: string): Promise<PhoneVerificationResult>;

  /**
   * Verify the code sent to phone number
   * @param phoneNumber Phone number in international format
   * @param code Verification code
   * @returns Promise with verification result
   */
  verifyCode(phoneNumber: string, code: string): Promise<VerifyCodeResult>;

  /**
   * Cancel an ongoing verification
   * @param verificationSid Verification SID
   * @returns Promise with cancellation result
   */
  cancelVerification(verificationSid: string): Promise<{ success: boolean }>;
}
