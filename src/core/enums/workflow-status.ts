/**
 * Workflow Status Enum
 * Defines the different states of a workflow execution
 */
 
export enum WorkflowStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED', 
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
  ABORTED = 'ABORTED',
}
