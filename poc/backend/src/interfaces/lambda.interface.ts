/**
 * Lambda Integration Interface
 * Defines contracts for Lambda function interactions
 */

export interface ILambdaProvider {
  /**
   * Generate presigned URL via Lambda
   */
  generatePresignedUrl(params: {
    userId: string;
    bucket: string;
    key: string;
    contentType?: string;
    expiresSeconds?: number;
  }): Promise<{
    uploadUrl: string;
    key: string;
    method: string;
    expiresIn: number;
  }>;

  /**
   * Start KYC validation workflow via Step Functions
   */
  startKycValidation(params: {
    cognitoSub: string;
    key: string;
    bucket: string;
  }): Promise<{
    executionArn: string;
    status: string;
  }>;

  /**
   * Call external service (simulates Lambda calling NestJS)
   */
  callExternalService(params: {
    url: string;
    method: string;
    data: any;
  }): Promise<any>;
}

export interface LambdaInvocationParams {
  functionName: string;
  payload: any;
  invocationType?: 'RequestResponse' | 'Event';
}

export interface StepFunctionsParams {
  stateMachineArn: string;
  input: any;
  name?: string;
}
