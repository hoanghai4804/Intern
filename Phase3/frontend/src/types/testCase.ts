// src/types/testCase.ts
export interface TestCase {
    id?: string;
    name: string;
    description: string;
    url: string;
    test_type: 'functional' | 'ui' | 'custom';
    actions?: string[];
    elements_to_check?: string[];
    custom_task?: string;
    expected_results?: string[];
    created_at?: Date;
  }
  
  export interface TestResult {
    id?: string;
    test_case_id: string;
    status: 'success' | 'error' | 'warning' | 'running';
    result: Record<string, any>;
    error?: string;
    screenshots?: string[];
    execution_time?: number;
    timestamp: Date;
  }
  
  export interface Agent {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'error';
    current_task?: string;
    last_activity?: Date;
  }