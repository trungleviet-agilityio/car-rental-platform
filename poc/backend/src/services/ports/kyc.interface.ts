/**
 * KYC workflow interface
*/

export interface IKycWorkflow {
  startKycValidation(stateMachineArn: string, input: { cognitoSub: string; key: string }): Promise<{ executionArn: string }>;
}