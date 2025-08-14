/**
 * Authentication Provider Interface
 * Abstracts authentication services (AWS Cognito, Firebase Auth, etc.)
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
   * Initiate authentication (usually sends OTP)
   */
  initiateAuth(phoneNumber: string): Promise<AuthResponse>;

  /**
   * Respond to auth challenge (verify OTP)
   */
  respondToChallenge(session: string, otpCode: string, phoneNumber?: string): Promise<TokenResponse>;

  /**
   * Username/password authentication
   */
  passwordAuth(username: string, password: string): Promise<TokenResponse>;

  /**
   * Sign up new user (optional)
   */
  signUp?(username: string, password: string, phone?: string, email?: string): Promise<{ message: string }>;

  /**
   * Confirm sign up (optional)
   */
  confirmSignUp?(username: string, code: string): Promise<{ message: string }>;
}
