/**
 * Workflow Management Service Interface
 * Abstract interface for workflow orchestration (Step Functions, etc.)
 */

export interface StartWorkflowRequest {
  workflowName: string;
  input: Record<string, any>;
  executionName?: string;
}

export interface StartWorkflowResponse {
  success: boolean;
  executionArn?: string;
  errorMessage?: string;
}

export interface UpdateWorkflowRequest {
  executionArn: string;
  taskToken: string;
  output: Record<string, any>;
  success: boolean;
}

export interface UpdateWorkflowResponse {
  success: boolean;
  errorMessage?: string;
}

export enum WorkflowStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED', 
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
  ABORTED = 'ABORTED',
}

export interface GetWorkflowStatusRequest {
  executionArn: string;
}

export interface GetWorkflowStatusResponse {
  success: boolean;
  status?: WorkflowStatus;
  errorMessage?: string;
}

export interface IWorkflowService {
  /**
   * Start a new workflow execution
   * @param request Workflow start request
   * @returns Promise with execution result
   */
  startWorkflow(request: StartWorkflowRequest): Promise<StartWorkflowResponse>;

  /**
   * Send task success to a waiting workflow
   * @param request Task success request
   * @returns Promise with update result
   */
  sendTaskSuccess(
    request: UpdateWorkflowRequest,
  ): Promise<UpdateWorkflowResponse>;

  /**
   * Send task failure to a waiting workflow
   * @param executionArn Execution ARN
   * @param taskToken Task token
   * @param error Error details
   * @returns Promise with update result
   */
  sendTaskFailure(
    executionArn: string,
    taskToken: string,
    error: { name: string; cause: string },
  ): Promise<UpdateWorkflowResponse>;

  /**
   * Get workflow execution status
   * @param request Status request
   * @returns Promise with status result
   */
  getWorkflowStatus(
    request: GetWorkflowStatusRequest,
  ): Promise<GetWorkflowStatusResponse>;

  /**
   * Stop a running workflow
   * @param executionArn Execution ARN
   * @param reason Reason for stopping
   * @returns Promise with stop result
   */
  stopWorkflow(
    executionArn: string,
    reason?: string,
  ): Promise<{ success: boolean; errorMessage?: string }>;

  /**
   * Health check for the workflow service
   * @returns Promise with health status
   */
  healthCheck(): Promise<{ status: string; timestamp: Date }>;
}
