export interface AuthClaims {
  sub: string;
  email?: string;
  phone_number?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface IAuthTokenValidator {
  validate(authHeader?: string): Promise<AuthClaims>;
}
