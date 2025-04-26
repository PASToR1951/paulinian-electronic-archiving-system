/**
 * Error handling utilities for consistent API responses
 */

export interface ApiError {
  status: number;
  message: string;
  details?: string;
  stack?: string;
}

export class AppError extends Error {
  status: number;
  details?: string;
  
  constructor(message: string, status = 500, details?: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    
    // Creating stack trace without captureStackTrace which isn't available in Deno
    if (!this.stack) {
      this.stack = new Error().stack;
    }
  }
}

// Create a standardized error response
export function createErrorResponse(error: Error | AppError | unknown): Response {
  const isAppError = error instanceof AppError;
  const status = isAppError ? error.status : 500;
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const errorDetails = isAppError ? error.details : undefined;
  
  // Only include stack in development environment
  // Using try/catch as Deno.env might not be available in all contexts
  let includeStack = false;
  try {
    // @ts-ignore: Deno namespace might not be recognized
    includeStack = Deno.env.get("ENV") === "development";
  } catch (_) {
    // If Deno.env is not available, default to not showing stack trace
  }
  
  const stack = includeStack && error instanceof Error ? error.stack : undefined;
  
  return new Response(
    JSON.stringify({
      error: true,
      message: errorMessage,
      details: errorDetails,
      stack: stack,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// Helper for 404 Not Found errors
export function notFound(resource: string): AppError {
  return new AppError(`${resource} not found`, 404);
}

// Helper for 400 Bad Request errors
export function badRequest(message: string, details?: string): AppError {
  return new AppError(message, 400, details);
}

// Helper for 401 Unauthorized errors
export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError(message, 401);
}

// Helper for 403 Forbidden errors
export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(message, 403);
}
