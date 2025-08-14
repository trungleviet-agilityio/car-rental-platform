/**
 * AWS Lambda Adapter
 * Real Lambda function integration for production
 */

import { Injectable, Logger } from '@nestjs/common';
import { ILambdaProvider } from '../../interfaces/lambda.interface';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsLambdaAdapter implements ILambdaProvider {
  private readonly logger = new Logger(AwsLambdaAdapter.name);
  private readonly lambda: AWS.Lambda;
  private readonly stepFunctions: AWS.StepFunctions;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    this.lambda = new AWS.Lambda({ region });
    this.stepFunctions = new AWS.StepFunctions({ region });
  }

  async generatePresignedUrl(params: {
    userId: string;
    bucket: string;
    key: string;
    contentType?: string;
    expiresSeconds?: number;
  }) {
    this.logger.log(`AWS Lambda: Generating presigned URL for ${params.key}`);
    
    const payload = {
      userId: params.userId,
      bucket: params.bucket,
      key: params.key,
      contentType: params.contentType,
      expiresSeconds: params.expiresSeconds,
    };

    const result = await this.lambda.invoke({
      FunctionName: process.env.GENERATE_PRESIGNED_URL_LAMBDA || 'GeneratePresignedUrl',
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse',
    }).promise();

    const response = JSON.parse(result.Payload as string);
    
    if (response.errorMessage) {
      throw new Error(`Lambda error: ${response.errorMessage}`);
    }

    return response.body;
  }

  async startKycValidation(params: {
    cognitoSub: string;
    key: string;
    bucket: string;
  }) {
    this.logger.log(`AWS Lambda: Starting KYC validation for ${params.cognitoSub}`);
    
    const stateMachineArn = process.env.KYC_STATE_MACHINE_ARN;
    if (!stateMachineArn) {
      throw new Error('KYC_STATE_MACHINE_ARN environment variable not set');
    }

    const result = await this.stepFunctions.startExecution({
      stateMachineArn,
      input: JSON.stringify({
        cognitoSub: params.cognitoSub,
        key: params.key,
        bucket: params.bucket,
      }),
      name: `kyc-validation-${params.cognitoSub}-${Date.now()}`,
    }).promise();

    return {
      executionArn: result.executionArn,
      status: 'RUNNING',
    };
  }

  async callExternalService(params: {
    url: string;
    method: string;
    data: any;
  }) {
    this.logger.log(`AWS Lambda: Calling external service ${params.method} ${params.url}`);
    
    // This would typically be called by Lambda functions, not from NestJS
    // But we can simulate it for testing
    const response = await fetch(params.url, {
      method: params.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.data),
    });

    return {
      success: response.ok,
      status: response.status,
      data: await response.json(),
    };
  }
}
