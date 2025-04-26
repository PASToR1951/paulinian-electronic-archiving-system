/**
 * API Client for communicating between React frontend and Deno backend
 * This file serves as a bridge between the two environments
 */

// Standard API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Base URL for API requests - change this to match your Deno server URL
const API_BASE_URL = '/api';

// Author types
export interface Author {
  id: string;
  name: string;
  institution: string;
}

// Document types
export interface Document {
  id: string;
  title: string;
  content?: string;
  category: string;
  volume: string;
  date: string;
  author: string;
}

// User types
export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

// Authentication types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Handle API responses and errors
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized access - could redirect to login or clear tokens
      localStorage.removeItem('auth_token');
    }
    
    // Try to get error message from response
    try {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `Error: ${response.status} ${response.statusText}`,
      };
    } catch (e) {
      // If we can't parse the error, return a generic one
      return {
        success: false,
        error: `Error: ${response.status} ${response.statusText}`,
      };
    }
  }
  
  // Parse successful response
  try {
    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (e) {
    return {
      success: false,
      error: 'Failed to parse response',
    };
  }
}

// Generic request function
async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: unknown,
  isFormData: boolean = false,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Setup request headers
  const headers: HeadersInit = {};
  
  // If not form data, set content type to JSON
  if (!isFormData && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for session management
  };
  
  // Add body if needed
  if (data) {
    if (isFormData && data instanceof FormData) {
      options.body = data;
    } else if (method !== 'GET') {
      options.body = JSON.stringify(data);
    }
  }
  
  try {
    const response = await fetch(url, options);
    return handleResponse<T>(response);
  } catch (error) {
    // Handle network errors
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Author API endpoints
export const authorApi = {
  getAll: async (): Promise<ApiResponse<Author[]>> => {
    return request<Author[]>('/authors');
  },
  
  getById: async (id: string): Promise<ApiResponse<Author>> => {
    return request<Author>(`/authors/${id}`);
  },
  
  create: async (author: Omit<Author, 'id'>): Promise<ApiResponse<Author>> => {
    return request<Author>('/authors', 'POST', author);
  },
  
  update: async (id: string, author: Partial<Author>): Promise<ApiResponse<Author>> => {
    return request<Author>(`/authors/${id}`, 'PUT', author);
  },
  
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return request<null>(`/authors/${id}`, 'DELETE');
  },
};

// Document API endpoints
export const documentApi = {
  getAll: async (category?: string, volume?: string): Promise<ApiResponse<Document[]>> => {
    let endpoint = '/documents';
    const params: string[] = [];
    
    if (category) {
      params.push(`category=${encodeURIComponent(category)}`);
    }
    
    if (volume) {
      params.push(`volume=${encodeURIComponent(volume)}`);
    }
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }
    
    return request<Document[]>(endpoint);
  },
  
  getById: async (id: string): Promise<ApiResponse<Document>> => {
    return request<Document>(`/documents/${id}`);
  },
  
  create: async (document: Omit<Document, 'id'>): Promise<ApiResponse<Document>> => {
    return request<Document>('/documents', 'POST', document);
  },
  
  update: async (id: string, document: Partial<Document>): Promise<ApiResponse<Document>> => {
    return request<Document>(`/documents/${id}`, 'PUT', document);
  },
  
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return request<null>(`/documents/${id}`, 'DELETE');
  },
  
  upload: async (file: File, metadata: Partial<Document>): Promise<ApiResponse<Document>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata fields to formData
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    return request<Document>('/documents/upload', 'POST', formData, true);
  },
};

// Authentication API endpoints
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await request<AuthResponse>('/auth/login', 'POST', credentials);
    
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response;
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await request<null>('/auth/logout', 'POST');
    
    // Clear token regardless of server response
    localStorage.removeItem('auth_token');
    
    return response;
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return request<User>('/auth/me');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

// Export a default object with all APIs
export default {
  author: authorApi,
  document: documentApi,
  auth: authApi,
}; 