// src/services/advancedAgentService.ts
import { api } from './api';

// Types matching user's backend
export interface TaskSubmission {
  agent_type: string;
  task_description: string;
  parameters?: Record<string, any>;
}

export interface TaskResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, any>;
  error?: string;
  execution_time?: number;
}

export interface AgentMetrics {
  active_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  total_tasks: number;
  success_rate: number;
  average_execution_time: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  scenario_type: string;
  url: string;
  actions_count: number;
  tags?: string[];
  priority: number;
}

export interface TestExecution {
  id: string;
  test_suite_id: string;
  agent_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  execution_time?: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
}

// New interfaces for API responses
export interface ScenarioRunResponse {
  task_id: string;
  scenario_id: string;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  components?: Record<string, string>;
}

export class AdvancedAgentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  // ============ TASK MANAGEMENT ============
  
  /**
   * Submit a new task to the agent system
   */
  async submitTask(
    agentType: string,
    taskDescription: string,
    parameters: Record<string, any> = {}
  ): Promise<TaskResponse> {
    try {
      const response = await api.post<TaskResponse>('/api/tasks/submit', {
        agent_type: agentType,
        task_description: taskDescription,
        parameters
      });
      
      console.log(`✅ Task submitted: ${response.task_id}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to submit task:', error);
      throw new Error(`Failed to submit task: ${error}`);
    }
  }

  /**
   * Get status of a specific task
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      const response = await api.get<TaskStatus>(`/api/tasks/${taskId}/status`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to get task status for ${taskId}:`, error);
      throw new Error(`Failed to get task status: ${error}`);
    }
  }

  /**
   * Get all currently active tasks
   */
  async getActiveTasks(): Promise<TaskStatus[]> {
    try {
      const response = await api.get<TaskStatus[]>('/api/tasks/active');
      return response;
    } catch (error) {
      console.error('❌ Failed to get active tasks:', error);
      throw new Error(`Failed to get active tasks: ${error}`);
    }
  }

  /**
   * Get recently completed tasks
   */
  async getCompletedTasks(limit: number = 20): Promise<TaskStatus[]> {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await api.get<TaskStatus[]>(`/api/tasks/completed?limit=${limit}&_t=${timestamp}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get completed tasks:', error);
      throw new Error(`Failed to get completed tasks: ${error}`);
    }
  }

  /**
   * Get all completed tasks from database
   */
  async getAllCompletedTasks(): Promise<TaskStatus[]> {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await api.get<TaskStatus[]>(`/api/tasks/completed?limit=9999&_t=${timestamp}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get all completed tasks:', error);
      throw new Error(`Failed to get all completed tasks: ${error}`);
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      console.log(`✅ Task cancelled: ${taskId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to cancel task ${taskId}:`, error);
      return false;
    }
  }

  // ============ SCENARIO MANAGEMENT ============

  /**
   * Get all available test scenarios
   */
  async getScenarios(): Promise<Scenario[]> {
    try {
      const response = await api.get<Scenario[]>('/api/scenarios');
      return response;
    } catch (error) {
      console.error('❌ Failed to get scenarios:', error);
      throw new Error(`Failed to get scenarios: ${error}`);
    }
  }

  /**
   * Run a specific scenario
   */
  async runScenario(
    scenarioId: string,
    parameters: Record<string, any> = {}
  ): Promise<ScenarioRunResponse> {
    try {
      const response = await api.post<ScenarioRunResponse>(`/api/scenarios/${scenarioId}/run`, {
        scenario_id: scenarioId,
        parameters
      });
      
      console.log(`✅ Scenario started: ${scenarioId}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to run scenario ${scenarioId}:`, error);
      throw new Error(`Failed to run scenario: ${error}`);
    }
  }

  // ============ METRICS & MONITORING ============

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<AgentMetrics> {
    try {
      const response = await api.get<AgentMetrics>('/api/metrics');
      return response;
    } catch (error) {
      console.error('❌ Failed to get metrics:', error);
      throw new Error(`Failed to get metrics: ${error}`);
    }
  }

  /**
   * Get recent test executions
   */
  async getRecentExecutions(limit: number = 10): Promise<TestExecution[]> {
    try {
      const response = await api.get<TestExecution[]>(`/api/executions/recent?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get recent executions:', error);
      throw new Error(`Failed to get recent executions: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await api.get<HealthCheckResponse>('/api/health');
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw new Error(`Health check failed: ${error}`);
    }
  }

  // ============ SPECIALIZED TEST METHODS ============

  /**
   * Submit a web test task
   */
  async submitWebTest(url: string, actions: string[]): Promise<TaskResponse> {
    return this.submitTask('web_test', `Test website functionality for ${url}`, {
      url,
      actions
    });
  }

  /**
   * Submit an enhanced test with screenshots
   */
  async submitEnhancedTest(
    url: string,
    description: string,
    takeScreenshots: boolean = true
  ): Promise<TaskResponse> {
    return this.submitTask('enhanced_test', description, {
      url,
      take_screenshots: takeScreenshots
    });
  }

  /**
   * Submit a form test
   */
  async submitFormTest(url: string, formSelector?: string): Promise<TaskResponse> {
    return this.submitTask('form_test', `Test form functionality on ${url}`, {
      url,
      form_selector: formSelector
    });
  }

  /**
   * Submit a performance test
   */
  async submitPerformanceTest(url: string): Promise<TaskResponse> {
    return this.submitTask('performance_test', `Performance test for ${url}`, {
      url
    });
  }

  /**
   * Submit a cross-browser test
   */
  async submitCrossBrowserTest(
    url: string,
    description: string,
    browsers: string[] = ['chromium', 'firefox', 'webkit']
  ): Promise<TaskResponse> {
    return this.submitTask('enhanced_test', `Cross-browser test: ${description}`, {
      url,
      cross_browser: true,
      browsers,
      test_type: 'cross_browser'
    });
  }

  /**
   * Submit a responsive design test
   */
  async submitResponsiveTest(
    url: string,
    viewports?: Array<{ width: number; height: number; name: string }>
  ): Promise<TaskResponse> {
    const defaultViewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    return this.submitTask('enhanced_test', `Responsive design test for ${url}`, {
      url,
      responsive_test: true,
      viewports: viewports || defaultViewports,
      test_type: 'responsive'
    });
  }

  // ============ UTILITY METHODS ============

  /**
   * Poll task status until completion
   */
  async pollTaskUntilComplete(
    taskId: string,
    onProgress?: (status: TaskStatus) => void,
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<TaskStatus> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Task ${taskId} did not complete within ${maxWaitTime}ms`);
  }

  /**
   * Get agent type display name
   */
  getAgentTypeName(agentType: string): string {
    const agentTypeNames: Record<string, string> = {
      'web_test': 'Web Test Agent',
      'enhanced_test': 'Enhanced Test Agent',
      'form_test': 'Form Test Agent',
      'api_test': 'API Test Agent',
      'performance_test': 'Performance Test Agent'
    };

    return agentTypeNames[agentType] || agentType;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      'completed': 'success',
      'failed': 'error',
      'cancelled': 'error',
      'running': 'info',
      'pending': 'warning'
    };

    return statusColors[status] || 'default';
  }

  /**
   * Format execution time for display
   */
  formatExecutionTime(seconds?: number): string {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
}

// Export singleton instance
export const advancedAgentService = new AdvancedAgentService();