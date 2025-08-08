import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private cognito: AWS.CognitoIdentityServiceProvider;

  constructor() {
    this.cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION || 'ap-southeast-1' });
  }

  async initiateAuth(phoneNumber: string) {
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
      if (!res.ChallengeName) {
        return { message: 'OTP sent successfully (mock)', session: 'mock_session', challenge_name: 'SMS_MFA' };
      }
      if (res.ChallengeName === 'SMS_MFA') {
        return { message: 'OTP sent successfully', session: res.Session, challenge_name: res.ChallengeName };
      }
      return { error: `Unexpected challenge: ${res.ChallengeName}` };
    } catch (e: any) {
      if (e?.code === 'UserNotFoundException' || /Incorrect username or password/i.test(e?.message || '')) {
        return { message: 'OTP sent successfully (simulated)', session: 'mock_session', challenge_name: 'SMS_MFA' };
      }
      throw e;
    }
  }

  async respondToChallenge(session: string, otpCode: string, phoneNumber?: string) {
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
    return this.cognito.adminRespondToAuthChallenge(params).promise();
  }
}
