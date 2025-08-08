import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private cognito: AWS.CognitoIdentityServiceProvider;
  private s3: AWS.S3;
  private sfn: AWS.StepFunctions;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    this.cognito = new AWS.CognitoIdentityServiceProvider({ region });
    this.s3 = new AWS.S3({ region, signatureVersion: 'v4' });
    this.sfn = new AWS.StepFunctions({ region });
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

  async passwordAuth(username: string, password: string) {
    const params: AWS.CognitoIdentityServiceProvider.AdminInitiateAuthRequest = {
      UserPoolId: process.env.USER_POOL_ID || '',
      ClientId: process.env.USER_POOL_CLIENT_ID || '',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };
    return this.cognito.adminInitiateAuth(params).promise();
  }

  async createPresignedPutUrl(bucket: string, key: string, contentType = 'application/octet-stream', expiresSeconds = 900) {
    const params: AWS.S3.PresignedPost.Params = {
      Bucket: bucket,
      Fields: {
        key,
        'Content-Type': contentType,
      },
      Conditions: [["content-length-range", 1, 20 * 1024 * 1024]],
      Expires: Math.floor(expiresSeconds / 60),
    } as any;

    // Prefer signed PUT URL for simpler clients
    const signedUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresSeconds,
      ContentType: contentType,
    });

    return { uploadUrl: signedUrl, key, method: 'PUT', expiresIn: expiresSeconds };
  }

  async startKycValidation(stateMachineArn: string, input: any) {
    const res = await this.sfn
      .startExecution({ stateMachineArn, input: JSON.stringify(input) })
      .promise();
    return res;
  }
}
