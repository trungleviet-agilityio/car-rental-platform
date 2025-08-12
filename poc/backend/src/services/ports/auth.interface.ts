/**
 * Auth provider interface
 */

export interface IAuthProvider {
  /**
   * Initiate authentication
   * @param phoneNumber - The phone number to authenticate
   * @returns The authentication response
   */
  initiateAuth(phoneNumber: string): Promise<{
    message: string;
    session: string;
    challenge_name: string;
  }>;

  /**
   * Respond to a challenge
   * @param session - The session ID
   * @param otpCode - The OTP code
   * @param phoneNumber - The phone number (optional)
   * @returns The authentication response
   */
  respondToChallenge(session: string, otpCode: string, phoneNumber?: string): Promise<{
    message: string;
    tokens: {
      AccessToken: string;
      IdToken: string;
      RefreshToken: string;
      TokenType: string;
      ExpiresIn: number;
    };
  }>;

  /**
   * Password authentication
   * @param username - The username
   * @param password - The password
   * @returns The authentication response
   */
  passwordAuth(username: string, password: string): Promise<{
    message: string;
    tokens: {
      AccessToken: string;
      IdToken: string;
      RefreshToken: string;
      TokenType: string;
      ExpiresIn: number;
    };
  }>;
}
