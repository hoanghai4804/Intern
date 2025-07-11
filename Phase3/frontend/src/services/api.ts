// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import toast from 'react-hot-toast';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_URL,
      timeout: 30000, // 30s timeout cho AI operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', error);
        
        // Handle common errors
        if (error.response?.status === 500) {
          toast.error('Server error occurred');
        } else if (error.response?.status === 404) {
          toast.error('Resource not found');
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout - AI operation taking too long');
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Health check
  async checkHealth(): Promise<{ status: string; version: string }> {
    return this.get('/api/health');
  }
}

export const api = new ApiService();