/**
 * Mock Lambda Adapter
 * Simulates Lambda function interactions for development/testing
 */

import { Injectable, Logger } from '@nestjs/common';
import { ILambdaProvider } from '../../interfaces/lambda.interface';

@Injectable()
export class MockLambdaAdapter implements ILambdaProvider {
  private readonly logger = new Logger(MockLambdaAdapter.name);

  async generatePresignedUrl(params: {
    userId: string;
    bucket: string;
    key: string;
    contentType?: string;
    expiresSeconds?: number;
  }) {
    this.logger.log(`Mock Lambda: Generating presigned URL for ${params.key}`);
    
    // Simulate Lambda processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      uploadUrl: `https://mock-storage.example.com/${params.bucket}/${params.key}?expires=${Date.now() + (params.expiresSeconds || 900) * 1000}`,
      key: params.key,
      method: 'PUT',
      expiresIn: params.expiresSeconds || 900,
    };
  }

  async startKycValidation(params: {
    cognitoSub: string;
    key: string;
    bucket: string;
  }) {
    this.logger.log(`Mock Lambda: Starting KYC validation for ${params.cognitoSub}`);
    
    // Simulate Step Functions execution
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      executionArn: `arn:aws:states:mock:execution:${params.cognitoSub}-${Date.now()}`,
      status: 'RUNNING',
    };
  }

  async callExternalService(params: {
    url: string;
    method: string;
    data: any;
  }) {
    this.logger.log(`Mock Lambda: Calling external service ${params.method} ${params.url}`);
    
    // Simulate external service call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      success: true,
      messageId: `mock-lambda-${Date.now()}`,
      data: params.data,
    };
  }
}
