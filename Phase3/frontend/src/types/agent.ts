// Agent related types
export interface Agent {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'error' | 'paused';
    current_task?: string;
    last_activity?: Date;
    capabilities?: string[];
    performance_metrics?: {
      tests_completed: number;
      success_rate: number;
      avg_execution_time: number;
    };
  }
  
  export interface AgentTask {
    id: string;
    agent_id: string;
    task_type: 'test' | 'analysis' | 'report';
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    created_at: Date;
    completed_at?: Date;
  }