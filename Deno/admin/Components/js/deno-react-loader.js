/**
 * Deno React Loader
 * 
 * This script handles loading React components from Deno HTML files
 * It serves as a bridge between Deno server-side rendering and React components
 */

/**
 * Load a React component and mount it to the specified element
 * 
 * @param {Object} options Configuration options
 * @param {string} options.componentPath Path to the React component
 * @param {string} options.mountPoint ID of the element to mount the component
 * @param {Object} options.props Props to pass to the component
 * @returns {Promise<void>}
 */
export async function loadReactComponent(options) {
  const { componentPath, mountPoint, props = {} } = options;
  
  if (!componentPath) {
    console.error('Component path is required');
    return;
  }
  
  if (!mountPoint) {
    console.error('Mount point ID is required');
    return;
  }
  
  try {
    // Check if we already have the React runtime loaded
    if (!window.React || !window.ReactDOM) {
      // Load React and ReactDOM from CDN if not already loaded
      await loadReactRuntime();
    }
    
    // Load the component dynamically
    const componentModule = await loadComponentFromPath(componentPath);
    
    if (!componentModule || !componentModule.default) {
      console.error(`No default export found in ${componentPath}`);
      return;
    }
    
    // Render the component
    const mountElement = document.getElementById(mountPoint);
    if (!mountElement) {
      console.error(`Mount point with ID "${mountPoint}" not found`);
      return;
    }
    
    // Create a provider wrapper to pass Deno Bridge context
    const WrappedComponent = createProviderWrapper(componentModule.default, props);
    
    // Render the component to the mount point
    window.ReactDOM.render(WrappedComponent, mountElement);
    
    console.log(`Successfully mounted React component at #${mountPoint}`);
  } catch (error) {
    console.error('Error loading React component:', error);
    
    // Show error in the mount point
    const mountElement = document.getElementById(mountPoint);
    if (mountElement) {
      mountElement.innerHTML = `
        <div class="error-container">
          <h3>Error Loading Component</h3>
          <p>${error.message || 'Unknown error'}</p>
        </div>
      `;
    }
  }
}

/**
 * Load React and ReactDOM from CDN
 */
async function loadReactRuntime() {
  // Create script elements and load React libraries
  const reactScript = document.createElement('script');
  reactScript.src = 'https://unpkg.com/react@17/umd/react.production.min.js';
  reactScript.crossOrigin = 'anonymous';
  
  const reactDomScript = document.createElement('script');
  reactDomScript.src = 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js';
  reactDomScript.crossOrigin = 'anonymous';
  
  // Wait for the scripts to load
  await Promise.all([
    loadScript(reactScript),
    loadScript(reactDomScript)
  ]);
  
  console.log('React runtime loaded');
}

/**
 * Load a script and wait for it to complete
 * 
 * @param {HTMLScriptElement} scriptElement The script element to load
 * @returns {Promise<void>}
 */
function loadScript(scriptElement) {
  return new Promise((resolve, reject) => {
    scriptElement.onload = resolve;
    scriptElement.onerror = reject;
    document.head.appendChild(scriptElement);
  });
}

/**
 * Load a component from a specified path
 * 
 * @param {string} path Path to the component
 * @returns {Promise<any>} The component module
 */
async function loadComponentFromPath(path) {
  // In a production environment, this would load a bundled component
  // For this example, we're assuming the component is built and available at buildPath
  
  // Convert the TypeScript path to the expected JavaScript build path
  const buildPath = path.replace('.tsx', '.js').replace('/React/', '/build/');
  
  try {
    // Dynamically import the component
    // Note: This requires your build system to output ESM modules
    const module = await import(buildPath);
    return module;
  } catch (error) {
    console.error(`Failed to load component from ${buildPath}:`, error);
    throw new Error(`Component not found or failed to load: ${path}`);
  }
}

/**
 * Create a provider wrapper for the component to provide Deno bridge context
 * 
 * @param {React.ComponentType} Component The React component to wrap
 * @param {Object} props Props to pass to the component
 * @returns {React.ReactElement} The wrapped component
 */
function createProviderWrapper(Component, props) {
  // This would normally use the DenoDataProvider from your existing code
  // But for simplicity, we're creating a simple provider here
  
  // Create a bridge instance for the component
  const bridge = createDenoBridge();
  
  // Create a context provider element
  return React.createElement(
    'div',
    { className: 'deno-react-container' },
    React.createElement(Component, { ...props, denoBridge: bridge })
  );
}

/**
 * Create a Deno bridge instance that matches the interface expected by components
 * 
 * @returns {Object} A Deno bridge instance
 */
function createDenoBridge() {
  return {
    apiUrl: '/api',
    
    // Add methods that match the DenoReactBridge interface
    documents: {
      compile: async (documentIds, title) => {
        // Implementation that matches the bridge's compile method
        return fetch('/api/documents/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentIds, title }),
        }).then(res => res.json());
      },
      
      expand: async (documentId) => {
        return fetch(`/api/documents/${documentId}/expand`)
          .then(res => res.json());
      }
    },
    
    // Add other bridge methods as needed
    // ...
  };
} 