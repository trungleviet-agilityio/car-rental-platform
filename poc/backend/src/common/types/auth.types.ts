/**
 * Auth Types
 * Types for authentication and authorization
 */

import { Request } from 'express';
import { AuthClaims } from '../../interfaces/auth-token.interface';

export interface RequestWithAuth extends Request {
  auth?: AuthClaims;
  headers: Request['headers'];
}
