/**
 * AWS service
 */

import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { AuthResponse, TokenResponse } from '../../services/ports/auth.interface';

@Injectable()
export class AwsService {
  private cognito: AWS.CognitoIdentityServiceProvider;
  private s3: AWS.S3;
  private sfn: AWS.StepFunctions;
  private ses: AWS.SES;
  private sns: AWS.SNS;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    this.cognito = new AWS.CognitoIdentityServiceProvider({ region });
    this.s3 = new AWS.S3({ region, signatureVersion: 'v4' });
    this.sfn = new AWS.StepFunctions({ region });
    this.ses = new AWS.SES({ region });
    this.sns = new AWS.SNS({ region });
  }

  /** Send email via SES */
  async sendEmail(params: { to: string; subject: string; text?: string; html?: string; from?: string }) {
    const Source = params.from || process.env.EMAIL_FROM || 'no-reply@verificationemail.com';
    await this.ses
      .sendEmail({
        Source,
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject },
          Body: params.html ? { Html: { Data: params.html } } : { Text: { Data: params.text || '' } },
        },
      })
      .promise();
    return { messageId: 'ses' };
  }

  /** Send SMS via SNS */
  async sendSms(params: { to: string; message: string; senderId?: string }) {
    await this.sns
      .publish({
        PhoneNumber: params.to,
        Message: params.message,
        MessageAttributes: params.senderId
          ? { 'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: params.senderId } }
          : undefined,
      })
      .promise();
    return { messageId: 'sns' };
  }

  /**
   * Sign up a user in Cognito (email/phone + password)
   */
  async signUp(
    usernameOrEmail: string,
    password: string,
    phoneNumber?: string,
    email?: string,
  ): Promise<{ message: string }> {
    const ClientId = process.env.USER_POOL_CLIENT_ID || '';
    const params: AWS.CognitoIdentityServiceProvider.SignUpRequest = {
      ClientId,
      Username: usernameOrEmail,
      Password: password,
      UserAttributes: [
        ...(email ? [{ Name: 'email', Value: email }] : []),
        ...(phoneNumber ? [{ Name: 'phone_number', Value: phoneNumber }] : []),
      ],
    };
    await this.cognito.signUp(params).promise();
    return { message: 'Sign up initiated. Please confirm the code.' };
  }

  /**
   * Confirm a user's sign up with the confirmation code
   */
  async confirmSignUp(usernameOrEmail: string, code: string): Promise<{ message: string }> {
    const ClientId = process.env.USER_POOL_CLIENT_ID || '';
    await this.cognito
      .confirmSignUp({ ClientId, Username: usernameOrEmail, ConfirmationCode: code })
      .promise();
    return { message: 'Sign up confirmed' };
  }

  /**
   * Initiate auth
   * @param phoneNumber - The phone number
   * @returns The initiate auth response
   */
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
      if (!res.ChallengeName) {
        return { message: 'OTP sent successfully (mock)', session: 'mock_session', challenge_name: 'SMS_MFA' };
      }
      if (res.ChallengeName === 'SMS_MFA') {
        return { message: 'OTP sent successfully', session: res.Session, challenge_name: res.ChallengeName };
      }
      return {
        message: `Unexpected challenge: ${res.ChallengeName}`,
        session: 'mock_session',
        challenge_name: res.ChallengeName,
      };
    } catch (e: any) {
      if (e?.code === 'UserNotFoundException' || /Incorrect username or password/i.test(e?.message || '')) {
        return { message: 'OTP sent successfully (simulated)', session: 'mock_session', challenge_name: 'SMS_MFA' };
      }
      throw e;
    }
  }

  /**
   * Respond to challenge
   * @param session - The session
   * @param otpCode - The OTP code
   * @param phoneNumber - The phone number
   * @returns The respond to challenge response
   */
  async respondToChallenge(
    session: string,
    otpCode: string,
    phoneNumber?: string,
  ): Promise<TokenResponse> {
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
      tokens: res.AuthenticationResult as { 
        AccessToken: string;
        IdToken: string;
        RefreshToken: string;
        TokenType: string;
        ExpiresIn: number;
      },
    };
  }

  /**
   * Password auth
   * @param username - The username
   * @param password - The password
   * @returns The password auth response
   */
  async passwordAuth(
    username: string,
    password: string,
  ): Promise<TokenResponse> {
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
      tokens: res.AuthenticationResult as { 
        AccessToken: string;
        IdToken: string;
        RefreshToken: string;
        TokenType: string;
        ExpiresIn: number;
      },
    };
  }

  /**
   * Create presigned PUT URL
   * @param bucket - The bucket
   * @param key - The key
   * @param contentType - The content type
   * @param expiresSeconds - The expires seconds
   * @returns The presigned PUT URL
   */
  async createPresignedPutUrl(
    bucket: string,
    key: string,
    contentType = 'application/octet-stream',
    expiresSeconds = 900,
  ): Promise<{ uploadUrl: string; key: string; method: 'PUT'; expiresIn: number }> {
    const params: AWS.S3.PresignedPost.Params = {
      Bucket: bucket,
      Fields: {
        key,
        'Content-Type': contentType,
      },
      Conditions: [["content-length-range", 1, 20 * 1024 * 1024]],
      Expires: Math.floor(expiresSeconds / 60),
    };

    // Prefer signed PUT URL for simpler clients
    const signedUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresSeconds,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    return {
      uploadUrl: signedUrl,
      key,
      method: 'PUT',
      expiresIn: expiresSeconds,
    };
  }

  /**
   * Start KYC validation
   * @param stateMachineArn - The state machine ARN
   * @param input - The input
   * @returns The execution ARN
   */
  async startKycValidation(
    stateMachineArn: string,
    input: { cognitoSub: string; key: string },
  ): Promise<{ executionArn: string }> {
    const res = await this.sfn
      .startExecution({ stateMachineArn, input: JSON.stringify(input) })
      .promise();
    return { executionArn: res.executionArn as string };
  }
}
