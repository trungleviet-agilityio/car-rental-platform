/**
 * Auth provider interface
 */

export interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken: string;
  TokenType: string;
  ExpiresIn: number;
}

export interface AuthResponse {
  message: string;
  session: string;
  challenge_name: string;
}

export interface TokenResponse {
  message: string;
  tokens: AuthTokens;
}

export interface IAuthProvider {
  /**
   * Initiate authentication
   * @param phoneNumber - The phone number to authenticate
   * @returns The authentication response
   */
  initiateAuth(phoneNumber: string): Promise<AuthResponse>;

  /**
   * Respond to a challenge
   * @param session - The session ID
   * @param otpCode - The OTP code
   * @param phoneNumber - The phone number (optional)
   * @returns The authentication response
   */
  respondToChallenge(session: string, otpCode: string, phoneNumber?: string): Promise<TokenResponse>;

  /**
   * Password authentication
   * @param username - The username
   * @param password - The password
   * @returns The authentication response
   */
  passwordAuth(username: string, password: string): Promise<TokenResponse>;

  /**
   * Sign up a new user
   * @param username - The username
   * @param password - The password
   * @param phone - The phone number (optional)
   * @param email - The email (optional)
   * @returns Sign up response
   */
  signUp?(username: string, password: string, phone?: string, email?: string): Promise<{ message: string }>;

  /**
   * Confirm sign up
   * @param username - The username
   * @param code - The confirmation code
   * @returns Confirmation response
   */
  confirmSignUp?(username: string, code: string): Promise<{ message: string }>;
}
