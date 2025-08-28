/**
 * Mock Workflow Service for Phase 1
 * Simple implementation for user onboarding workflow
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  IWorkflowService,
  StartWorkflowRequest,
  StartWorkflowResponse,
  GetWorkflowStatusRequest,
  GetWorkflowStatusResponse,
  UpdateWorkflowRequest,
  UpdateWorkflowResponse,
} from '@/core/interfaces/auth/workflow.interface';

@Injectable()
export class MockWorkflowService implements IWorkflowService {
  private readonly logger = new Logger(MockWorkflowService.name);

  async startWorkflow(request: StartWorkflowRequest): Promise<StartWorkflowResponse> {
    this.logger.log(`[MOCK] Starting workflow for user: ${request.input.userId}`);
    
    const mockExecutionArn = `mock-execution-${Date.now()}`;
    
    return {
      success: true,
      executionArn: mockExecutionArn,
    };
  }

  async getWorkflowStatus(request: GetWorkflowStatusRequest): Promise<GetWorkflowStatusResponse> {
    this.logger.log(`[MOCK] Getting workflow status: ${request.executionArn}`);
    
    return {
      success: true,
    };
  }

  async updateWorkflow(request: UpdateWorkflowRequest): Promise<UpdateWorkflowResponse> {
    this.logger.log(`[MOCK] Updating workflow: ${request.executionArn}`);
    
    return {
      success: true,
    };
  }

  async sendTaskSuccess(request: UpdateWorkflowRequest): Promise<UpdateWorkflowResponse> {
    this.logger.log(`[MOCK] Sending task success`);
    return { success: true };
  }

  async sendTaskFailure(
    executionArn: string, 
    taskToken: string, 
    error: { name: string; cause: string; }
  ): Promise<UpdateWorkflowResponse> {
    this.logger.log(`[MOCK] Sending task failure for ${executionArn}`);
    return { success: true };
  }

  async stopWorkflow(executionArn: string): Promise<{ success: boolean }> {
    this.logger.log(`[MOCK] Stopping workflow: ${executionArn}`);
    return { success: true };
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return {
      status: 'healthy',
      timestamp: new Date(),
    };
  }
}
