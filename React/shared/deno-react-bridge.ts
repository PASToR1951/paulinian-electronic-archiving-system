/**
 * DenoReactBridge - A bridge between Deno backend and React frontend
 * 
 * This class provides methods for server-side rendering, data syncing,
 * and API communication between React components and the Deno backend.
 */

import apiClient, { ApiResponse, Document } from './api-client.ts';

// Configuration interface for the bridge
export interface DenoReactBridgeConfig {
  apiUrl?: string;
  enableSSR?: boolean;
  debugMode?: boolean;
}

export class DenoReactBridge {
  private config: DenoReactBridgeConfig;
  private envVariables: Record<string, string> = {};
  private isServer: boolean;
  
  /**
   * Documents API for handling document operations
   */
  public documents = {
    /**
     * Compiles multiple documents into a single compiled document
     * @param documentIds - Array of document IDs to compile
     * @param title - Title for the compiled document
     * @returns Promise with the compiled document or error
     */
    compile: async (documentIds: string[], title: string): Promise<ApiResponse<Document>> => {
      try {
        const response = await fetch('/api/documents/compile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentIds, title }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to compile documents: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error compiling documents:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to compile documents',
        };
      }
    },
    
    /**
     * Expands a compiled document to show its child documents
     * @param documentId - ID of the compiled document to expand
     * @returns Promise with the expanded document details or error
     */
    expand: async (documentId: string): Promise<ApiResponse<Document[]>> => {
      try {
        const response = await fetch(`/api/documents/${documentId}/expand`);
        
        if (!response.ok) {
          throw new Error(`Failed to expand document: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error expanding document:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to expand document',
        };
      }
    }
  };

  constructor(config: DenoReactBridgeConfig = {}) {
    this.config = {
      apiUrl: '/api',
      enableSSR: true,
      debugMode: false,
      ...config,
    };
    
    // Detect if we're running on the server (Deno) or client (browser)
    this.isServer = typeof window === 'undefined';
    
    if (this.config.debugMode) {
      console.log(`DenoReactBridge initialized in ${this.isServer ? 'server' : 'client'} mode`);
    }
  }

  /**
   * Renders a React component on the server side
   * @param Component - React component to render
   * @param props - Props to pass to the component
   * @returns HTML string of the rendered component
   */
  async renderServerSide<P>(Component: React.ComponentType<P>, props: P): Promise<string> {
    if (!this.isServer) {
      throw new Error('Server-side rendering can only be performed on the server');
    }
    
    try {
      // This would use a server-side renderer in Deno
      // Actual implementation would depend on the SSR library being used
      return `<!-- Server-side rendered component -->`;
    } catch (error) {
      console.error('Error rendering component server-side:', error);
      throw error;
    }
  }

  /**
   * Synchronizes data between client and server
   * @param key - Key to identify the data
   * @param data - Data to synchronize
   * @returns Promise resolving when sync is complete
   */
  async syncData<T>(key: string, data: T): Promise<void> {
    try {
      if (this.isServer) {
        // In server mode, we would store this data to be hydrated later
        console.log(`Storing data for key "${key}" for hydration`);
      } else {
        // In client mode, we would send this data to the server
        await fetch(`${this.config.apiUrl}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, data }),
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  /**
   * Hydrates a React component with server data
   * @param componentId - ID of the component to hydrate
   * @returns Promise resolving with hydration data
   */
  async hydrateComponent(componentId: string): Promise<Record<string, unknown>> {
    try {
      if (this.isServer) {
        // In server mode, return empty data (actual implementation would vary)
        return {};
      }
      
      // In client mode, fetch hydration data from server
      const response = await fetch(`${this.config.apiUrl}/hydrate/${componentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to hydrate component: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error hydrating component:', error);
      return {};
    }
  }

  /**
   * Loads environment variables from the server
   * @returns Promise resolving when environment variables are loaded
   */
  async loadEnvironmentVariables(): Promise<void> {
    try {
      if (this.isServer) {
        // In server mode, we would access env vars directly
        // This is a simplified example
        this.envVariables = {
          API_URL: this.config.apiUrl || '',
          DEBUG: String(this.config.debugMode),
        };
      } else {
        // In client mode, fetch env vars from server
        const response = await fetch(`${this.config.apiUrl}/env`);
        
        if (!response.ok) {
          throw new Error(`Failed to load environment variables: ${response.statusText}`);
        }
        
        this.envVariables = await response.json();
      }
    } catch (error) {
      console.error('Error loading environment variables:', error);
      throw error;
    }
  }

  /**
   * Gets an environment variable
   * @param key - Key of the environment variable
   * @param defaultValue - Default value if not found
   * @returns The environment variable value or default
   */
  getEnv(key: string, defaultValue: string = ''): string {
    return this.envVariables[key] || defaultValue;
  }
}

// Export a default instance with default configuration
export default new DenoReactBridge({
  apiUrl: '/api',
  enableSSR: true,
  debugMode: false,
}); 