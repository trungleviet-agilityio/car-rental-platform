/**
 * AWS Cognito Authentication Adapter
 * Implements IAuthProvider using AWS Cognito
 */

import { Injectable, Logger } from '@nestjs/common';
import { IAuthProvider, AuthResponse, TokenResponse } from '../../interfaces/auth.interface';
import AWS from 'aws-sdk';

@Injectable()
export class AwsAuthAdapter implements IAuthProvider {
  private readonly logger = new Logger(AwsAuthAdapter.name);
  private readonly cognito: AWS.CognitoIdentityServiceProvider;

  constructor() {
    this.cognito = new AWS.CognitoIdentityServiceProvider({ 
      region: process.env.AWS_REGION || 'ap-southeast-1' 
    });
  }

  async initiateAuth(phoneNumber: string): Promise<AuthResponse> {
    const params: AWS.CognitoIdentityServiceProvider.AdminInitiateAuthRequest = {
      UserPoolId: process.env.USER_POOL_ID || '',
      ClientId: process.env.USER_POOL_CLIENT_ID || '',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: phoneNumber,
        PASSWORD: 'dummy_password',
      },
    };

    try {
      const res = await this.cognito.adminInitiateAuth(params).promise();
      if (res.ChallengeName === 'SMS_MFA') {
        return { 
          message: 'OTP sent successfully', 
          session: res.Session!, 
          challenge_name: res.ChallengeName 
        };
      }
      return {
        message: `Unexpected challenge: ${res.ChallengeName}`,
        session: 'mock_session',
        challenge_name: res.ChallengeName || 'SMS_MFA',
      };
    } catch (e: any) {
      if (e?.code === 'UserNotFoundException') {
        return { 
          message: 'OTP sent successfully (simulated)', 
          session: 'mock_session', 
          challenge_name: 'SMS_MFA' 
        };
      }
      throw e;
    }
  }

  async respondToChallenge(session: string, otpCode: string, phoneNumber?: string): Promise<TokenResponse> {
    const params: AWS.CognitoIdentityServiceProvider.AdminRespondToAuthChallengeRequest = {
      UserPoolId: process.env.USER_POOL_ID || '',
      ClientId: process.env.USER_POOL_CLIENT_ID || '',
      ChallengeName: 'SMS_MFA',
      Session: session,
      ChallengeResponses: {
        SMS_MFA_CODE: otpCode,
        USERNAME: phoneNumber || '',
      },
    };
    
    const res = await this.cognito.adminRespondToAuthChallenge(params).promise();
    return {
      message: 'Login successful',
      tokens: res.AuthenticationResult as any,
    };
  }

  async passwordAuth(username: string, password: string): Promise<TokenResponse> {
    const params: AWS.CognitoIdentityServiceProvider.AdminInitiateAuthRequest = {
      UserPoolId: process.env.USER_POOL_ID || '',
      ClientId: process.env.USER_POOL_CLIENT_ID || '',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };
    
    const res = await this.cognito.adminInitiateAuth(params).promise();
    return {
      message: 'Login successful',
      tokens: res.AuthenticationResult as any,
    };
  }

  async signUp(username: string, password: string, phone?: string, email?: string): Promise<{ message: string }> {
    const params: AWS.CognitoIdentityServiceProvider.SignUpRequest = {
      ClientId: process.env.USER_POOL_CLIENT_ID || '',
      Username: username,
      Password: password,
      UserAttributes: [
        ...(email ? [{ Name: 'email', Value: email }] : []),
        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
      ],
    };
    
    await this.cognito.signUp(params).promise();
    return { message: 'Sign up initiated. Please confirm the code.' };
  }

  async confirmSignUp(username: string, code: string): Promise<{ message: string }> {
    await this.cognito.confirmSignUp({
      ClientId: process.env.USER_POOL_CLIENT_ID || '',
      Username: username,
      ConfirmationCode: code,
    }).promise();
    
    return { message: 'Sign up confirmed' };
  }
}
