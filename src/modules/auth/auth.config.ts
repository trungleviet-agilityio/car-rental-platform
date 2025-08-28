/**
 * Auth Configuration - Service Implementation Selection
 * Demonstrates advanced DIP implementation with environment-based service selection
 */

import { ConfigService } from '@nestjs/config';
import { TwilioVerifyService } from '@/infrastructure/communication/twilio-verify.service';
import { MockPhoneVerificationService } from '@/infrastructure/communication/mock-phone-verification.service';
import { CognitoService } from '@/infrastructure/auth/cognito.service';
import { MockWorkflowService } from '@/infrastructure/workflows/mock-workflow.service';
import { StepFunctionsService } from '@/infrastructure/workflows/step-functions.service';

/**
 * Factory function to select phone verification service based on environment
 */
export function createPhoneVerificationService(configService: ConfigService) {
  const environment = configService.get<string>('app.nodeEnv', 'development');

  switch (environment) {
    case 'test':
    case 'development':
      // Use mock service for testing and development
      return MockPhoneVerificationService;

    case 'staging':
    case 'production':
      // Use Twilio for staging and production
      return TwilioVerifyService;

    default:
      return MockPhoneVerificationService;
  }
}

/**
 * Factory function to select user management service based on environment
 */
export function createUserManagementService(configService: ConfigService) {
  const environment = configService.get<string>('app.nodeEnv', 'development');

  // In the future, you could switch between Cognito, Auth0, Firebase Auth, etc.
  switch (environment) {
    case 'test':
      // Could use MockUserManagementService for testing
      return CognitoService;

    case 'development':
    case 'staging':
    case 'production':
      return CognitoService;

    default:
      return CognitoService;
  }
}

/**
 * Factory function to select workflow service based on environment
 */
export function createWorkflowService(configService: ConfigService) {
  const environment = configService.get<string>('app.nodeEnv', 'development');
  const provider = configService.get<string>('WORKFLOW_PROVIDER', 'step-functions');

  // Use AWS Step Functions for asynchronous onboarding workflows
  switch (environment) {
    case 'test':
      // Use MockWorkflowService for testing
      return MockWorkflowService;

    case 'development':
      // Use Step Functions in development if configured, otherwise mock
      return provider === 'mock' ? MockWorkflowService : StepFunctionsService;

    case 'staging':
    case 'production':
      return StepFunctionsService; // Always use Step Functions in staging/production

    default:
      return StepFunctionsService;
  }
}

/**
 * Service configuration mapping
 * This could be extended to support feature flags, A/B testing, etc.
 */
export const SERVICE_IMPLEMENTATIONS = {
  phoneVerification: {
    mock: MockPhoneVerificationService,
    twilio: TwilioVerifyService,
    // Future implementations:
    // aws_sns: AWSPinpointVerificationService,
  },
  userManagement: {
    cognito: CognitoService,
  },
  workflow: {
    mock: MockWorkflowService,
    stepFunctions: MockWorkflowService,
  },
};

/**
 * Advanced service selection with feature flags
 */
export function selectServiceImplementation<T>(
  serviceType: keyof typeof SERVICE_IMPLEMENTATIONS,
  implementation: string,
): new (...args: any[]) => T {
  const serviceMap = SERVICE_IMPLEMENTATIONS[serviceType] as any;

  const ServiceClass = serviceMap[implementation];

  if (!ServiceClass) {
    throw new Error(
      `Unknown ${serviceType} implementation: ${implementation}. ` +
        `Available implementations: ${Object.keys(serviceMap).join(', ')}`,
    );
  }

  return ServiceClass as new (...args: any[]) => T;
}
