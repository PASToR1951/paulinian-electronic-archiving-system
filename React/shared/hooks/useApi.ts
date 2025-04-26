import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '../api-client.ts';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiHook<T, P extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...params: P) => Promise<void>;
  reset: () => void;
}

/**
 * A hook for handling API requests with loading, error, and data states
 */
export function useApi<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<ApiResponse<T>>,
  executeOnMount: boolean = false,
  initialParams?: P
): ApiHook<T, P> {
  // State for API call
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: executeOnMount,
    error: null,
  });

  // Function to execute the API call
  const execute = useCallback(
    async (...params: P) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await apiFunction(...params);
        
        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || 'An unknown error occurred',
          });
        }
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    },
    [apiFunction]
  );

  // Reset function to clear state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Execute on mount if requested
  useEffect(() => {
    if (executeOnMount && initialParams) {
      execute(...initialParams);
    }
  }, [executeOnMount, execute, initialParams]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * A hook for handling API requests that should be executed on component mount
 */
export function useApiOnMount<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<ApiResponse<T>>,
  ...params: P
): Omit<ApiHook<T, P>, 'execute'> & { refresh: () => Promise<void> } {
  const api = useApi<T, P>(apiFunction, true, params as P);

  const refresh = useCallback(async () => {
    await api.execute(...(params as P));
  }, [api, params]);

  return {
    data: api.data,
    loading: api.loading,
    error: api.error,
    reset: api.reset,
    refresh,
  };
}

export default useApi; 