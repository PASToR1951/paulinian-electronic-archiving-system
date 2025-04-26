/**
 * CORS middleware to handle preflight requests and add CORS headers
 */

interface CorsOptions {
  allowOrigin: string | string[];
  allowMethods: string[];
  allowHeaders: string[];
  allowCredentials: boolean;
}

const defaultOptions: CorsOptions = {
  allowOrigin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  allowCredentials: true
};

// Create CORS headers based on options
export function createCorsHeaders(options: Partial<CorsOptions> = {}): HeadersInit {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const origin = Array.isArray(mergedOptions.allowOrigin) 
    ? mergedOptions.allowOrigin.join(", ") 
    : mergedOptions.allowOrigin;
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": mergedOptions.allowMethods.join(", "),
    "Access-Control-Allow-Headers": mergedOptions.allowHeaders.join(", "),
    "Access-Control-Allow-Credentials": mergedOptions.allowCredentials.toString()
  };
}

// Apply CORS headers to a response
export function applyCorsHeaders(response: Response | undefined, options: Partial<CorsOptions> = {}): Response {
  // If response is undefined, create a new empty response
  if (!response) {
    console.warn("Attempting to apply CORS headers to undefined response; creating empty response");
    response = new Response(null, { status: 204 });
  }
  
  // Check if headers can be accessed
  let existingHeaders: Headers;
  try {
    existingHeaders = new Headers(response.headers);
  } catch (error) {
    console.warn("Error accessing response headers, creating new headers", error);
    existingHeaders = new Headers();
  }
  
  const corsHeaders = createCorsHeaders(options);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    existingHeaders.set(key, String(value));
  });
  
  try {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: existingHeaders
    });
  } catch (error) {
    console.warn("Error creating response with CORS headers", error);
    // Create a fallback response if original response cannot be used
    return new Response(null, {
      status: 204,
      headers: existingHeaders
    });
  }
}

// Handle CORS preflight requests
export function handleCorsPreflightRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders()
  });
}
