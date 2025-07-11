// src/services/index.ts - Updated exports
export { api } from './api';
export { advancedAgentService, AdvancedAgentService } from './advancedAgentService';

// Re-export types
export type {
  TaskSubmission,
  TaskResponse,
  TaskStatus,
  AgentMetrics,
  Scenario,
  TestExecution
} from './advancedAgentService';