import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DenoReactBridge } from '../shared/deno-react-bridge.ts';

// Create a context for the bridge
const DenoContext = createContext<{
  bridge: DenoReactBridge;
  loading: boolean;
  error: string | null;
}>({
  bridge: new DenoReactBridge(),
  loading: true,
  error: null,
});

interface DenoDataProviderProps {
  children: ReactNode;
  config?: {
    apiUrl?: string;
    enableSSR?: boolean;
    debugMode?: boolean;
  };
}

/**
 * Provider component that makes the Deno-React bridge available throughout the app
 */
export const DenoDataProvider: React.FC<DenoDataProviderProps> = ({
  children,
  config = {},
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bridge] = useState(() => new DenoReactBridge(config));

  useEffect(() => {
    // Initialize the bridge by loading environment variables
    const initBridge = async () => {
      try {
        await bridge.loadEnvironmentVariables();
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Deno connection');
        setLoading(false);
      }
    };

    initBridge();
  }, [bridge]);

  return (
    <DenoContext.Provider value={{ bridge, loading, error }}>
      {children}
    </DenoContext.Provider>
  );
};

/**
 * Hook to use the Deno bridge in any component
 */
export const useDeno = () => {
  const context = useContext(DenoContext);
  
  if (context === undefined) {
    throw new Error('useDeno must be used within a DenoDataProvider');
  }
  
  return context;
};

/**
 * Hook for working with documents through the Deno bridge
 */
export const useDocuments = () => {
  const { bridge, loading, error } = useDeno();
  
  return {
    loading,
    error,
    compileDocuments: bridge.documents.compile,
    expandDocument: bridge.documents.expand,
  };
}; 