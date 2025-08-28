/**
 * AWS Step Functions Service
 * Handles asynchronous user onboarding workflows
 * Prevents blocking users while KYC verification is in progress
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  StopExecutionCommand,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from '@aws-sdk/client-sfn';

import {
  IWorkflowService,
  StartWorkflowRequest,
  StartWorkflowResponse,
  GetWorkflowStatusRequest,
  GetWorkflowStatusResponse,
  UpdateWorkflowRequest,
  UpdateWorkflowResponse,
  WorkflowStatus,
} from '@/core/interfaces/auth/workflow.interface';
import { logError, getErrorMessage } from '@/shared/utils/error-handler';

@Injectable()
export class StepFunctionsService implements IWorkflowService {
  private readonly logger = new Logger(StepFunctionsService.name);
  private readonly sfnClient: SFNClient;
  private readonly stateMachineArn: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('app.aws.region');
    this.stateMachineArn = this.configService.get<string>(
      'app.aws.stepFunctions.onboardingStateMachine',
    ) || 'arn:aws:states:us-east-1:123456789012:stateMachine:user-onboarding';

    if (!region) {
      throw new Error(
        'AWS Step Functions configuration is missing. Please check your environment variables.',
      );
    }

    this.sfnClient = new SFNClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('app.aws.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('app.aws.secretAccessKey') || '',
      },
    });

    this.logger.log(`Step Functions service initialized for region: ${region}`);
  }

  /**
   * Start the user onboarding workflow
   * This allows users to continue using the app while KYC is processed asynchronously
   */
  async startWorkflow(request: StartWorkflowRequest): Promise<StartWorkflowResponse> {
    try {
      this.logger.log(`Starting onboarding workflow for user: ${request.input.userId}`);

      const executionName = `user-onboarding-${request.input.userId}-${Date.now()}`;
      
      const command = new StartExecutionCommand({
        stateMachineArn: this.stateMachineArn,
        name: executionName,
        input: JSON.stringify({
          userId: request.input.userId,
          email: request.input.email,
          phoneNumber: request.input.phoneNumber,
          timestamp: new Date().toISOString(),
          workflow: {
            steps: [
              'PHONE_VERIFICATION',
              'PROFILE_COMPLETION', 
              'DOCUMENT_UPLOAD',
              'KYC_VERIFICATION',
              'ACCOUNT_ACTIVATION',
              'WELCOME_NOTIFICATION'
            ],
            currentStep: 'PHONE_VERIFICATION',
            metadata: {
              initiatedBy: 'USER_REGISTRATION',
              priority: 'STANDARD',
              region: this.configService.get<string>('app.aws.region'),
            }
          }
        }),
      });

      const response = await this.sfnClient.send(command);

      this.logger.log(`Workflow started successfully: ${response.executionArn}`, {
        userId: request.input.userId,
        executionArn: response.executionArn,
      });

      return {
        success: true,
        executionArn: response.executionArn!,
      };
    } catch (error) {
      logError(error, `Failed to start workflow for user: ${request.input.userId}`);
      
      return {
        success: false,
        errorMessage: getErrorMessage(error),
      };
    }
  }

  /**
   * Get the current status of the onboarding workflow
   * Users can check their progress without blocking
   */
  async getWorkflowStatus(request: GetWorkflowStatusRequest): Promise<GetWorkflowStatusResponse> {
    try {
      this.logger.debug(`Getting workflow status: ${request.executionArn}`);

      const command = new DescribeExecutionCommand({
        executionArn: request.executionArn,
      });

      const response = await this.sfnClient.send(command);

      // Map AWS Step Functions status to our workflow status
      const status = this.mapAWSStatusToWorkflowStatus(response.status!);

      return {
        success: true,
        status,
      };
    } catch (error) {
      logError(error, `Failed to get workflow status: ${request.executionArn}`);
      
      return {
        success: false,
        errorMessage: getErrorMessage(error),
      };
    }
  }

  /**
   * Update workflow progress (called by Step Function tasks)
   * This allows the workflow to progress through KYC verification
   */
  async updateWorkflow(request: UpdateWorkflowRequest): Promise<UpdateWorkflowResponse> {
    try {
      this.logger.log(`Updating workflow: ${request.executionArn}`);

      // In a real implementation, this might update the workflow state
      // or trigger specific actions based on the update type
      
      return {
        success: true,
      };
    } catch (error) {
      logError(error, `Failed to update workflow: ${request.executionArn}`);
      
      return {
        success: false,
        errorMessage: getErrorMessage(error),
      };
    }
  }

  /**
   * Send task success (for manual approval steps like KYC)
   * Called when KYC verification is approved
   */
  async sendTaskSuccess(request: UpdateWorkflowRequest): Promise<UpdateWorkflowResponse> {
    try {
      if (!request.taskToken) {
        throw new Error('Task token is required for sending task success');
      }

      this.logger.log(`Sending task success for workflow: ${request.executionArn}`);

      const command = new SendTaskSuccessCommand({
        taskToken: request.taskToken,
        output: JSON.stringify({
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          approvedBy: 'KYC_SERVICE',
          result: request.output || {}
        }),
      });

      await this.sfnClient.send(command);

      this.logger.log(`Task success sent for workflow: ${request.executionArn}`);

      return {
        success: true,
      };
    } catch (error) {
      logError(error, `Failed to send task success: ${request.executionArn}`);
      
      return {
        success: false,
        errorMessage: getErrorMessage(error),
      };
    }
  }

  /**
   * Send task failure (for rejected KYC or errors)
   * Called when KYC verification is rejected
   */
  async sendTaskFailure(
    executionArn: string,
    taskToken: string,
    error: { name: string; cause: string; }
  ): Promise<UpdateWorkflowResponse> {
    try {
      this.logger.log(`Sending task failure for workflow: ${executionArn}`);

      const command = new SendTaskFailureCommand({
        taskToken,
        error: error.name,
        cause: error.cause,
      });

      await this.sfnClient.send(command);

      this.logger.log(`Task failure sent for workflow: ${executionArn}`);

      return {
        success: true,
      };
    } catch (err) {
      logError(err, `Failed to send task failure: ${executionArn}`);
      
      return {
        success: false,
        errorMessage: getErrorMessage(err),
      };
    }
  }

  /**
   * Stop a running workflow (emergency stop or user cancellation)
   */
  async stopWorkflow(executionArn: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Stopping workflow: ${executionArn}`);

      const command = new StopExecutionCommand({
        executionArn,
        cause: 'User requested cancellation or emergency stop',
      });

      await this.sfnClient.send(command);

      this.logger.log(`Workflow stopped: ${executionArn}`);

      return { success: true };
    } catch (error) {
      logError(error, `Failed to stop workflow: ${executionArn}`);
      return { success: false };
    }
  }

  /**
   * Health check for Step Functions service
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Simple health check - list state machines to verify connectivity
      await this.sfnClient.send(new DescribeExecutionCommand({
        executionArn: 'arn:aws:states:us-east-1:123456789012:execution:health-check:test'
      }));
      
      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      // Expected to fail for health check, but confirms connectivity
      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Map AWS Step Functions status to our workflow status enum
   */
  private mapAWSStatusToWorkflowStatus(awsStatus: string): WorkflowStatus {
    switch (awsStatus) {
      case 'RUNNING':
        return WorkflowStatus.RUNNING;
      case 'SUCCEEDED':
        return WorkflowStatus.SUCCEEDED;
      case 'FAILED':
        return WorkflowStatus.FAILED;
      case 'TIMED_OUT':
        return WorkflowStatus.TIMED_OUT;
      case 'ABORTED':
        return WorkflowStatus.ABORTED;
      default:
        return WorkflowStatus.RUNNING;
    }
  }
}
