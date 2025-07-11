// src/types/index.ts
export * from './testCase';
export type { Agent, AgentTask } from './agent';

// Common API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}