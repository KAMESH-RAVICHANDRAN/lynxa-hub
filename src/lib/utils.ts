import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Configuration
export const API_BASE_URL = 'https://lynxa-pro-backend.vercel.app';

// API Helper Functions
export class ApiClient {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || localStorage.getItem('lynxa_api_key');
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('lynxa_api_key', key);
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey || '',
    };
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Specific API methods
  async getAnalytics() {
    return this.get('/api/analytics');
  }

  async getMonitoring() {
    return this.get('/api/monitoring');
  }

  async getHealth() {
    return this.get('/api/health');
  }

  async getUserInfo() {
    return this.get('/api/user/info');
  }

  async generateApiKey(name: string) {
    return this.post('/api/generate-key', { name });
  }

  async revokeApiKey(keyId: string) {
    return this.delete(`/api/revoke-key?key_id=${keyId}`);
  }

  async sendMessage(message: string, conversationId?: string) {
    return this.post('/api/lynxa', {
      message,
      conversation_id: conversationId,
      model: 'lynxa-pro',
      stream: false
    });
  }
}

// Default API client instance
export const apiClient = new ApiClient();
