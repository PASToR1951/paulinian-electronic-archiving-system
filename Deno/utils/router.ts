/**
 * Router utility for handling HTTP routes in a clean, consistent way
 */

import { AppError, createErrorResponse } from "./errors.ts";
import { applyCorsHeaders } from "../middleware/cors.ts";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response>;
export type Middleware = (request: Request, next: () => Promise<Response>) => Promise<Response>;

// Simple path pattern matching implementation since URLPattern may not be available
export class PathPattern {
  private parts: (string | { name: string, pattern: RegExp })[];
  private regex: RegExp;
  
  constructor(public path: string) {
    // Parse the path pattern
    this.parts = [];
    const paramNameRegex = /[\w-]+/;
    
    // Parse path segments and identify parameter segments
    const segments = path.split('/');
    const regexSegments = segments.map(segment => {
      if (segment.startsWith(':')) {
        // This is a parameter segment
        const paramName = segment.substring(1);
        if (paramNameRegex.test(paramName)) {
          this.parts.push({ name: paramName, pattern: /[^/]+/ });
          return '([^/]+)';
        }
      }
      // This is a literal segment - escape special regex characters
      return segment.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1');
    });
    
    // Create the regex pattern
    const regexPattern = `^${regexSegments.join('/')}$`;
    
    try {
      this.regex = new RegExp(regexPattern);
      console.log(`Created regex pattern for ${path}: ${regexPattern}`);
    } catch (error) {
      console.error(`Invalid regex pattern: ${regexPattern}`, error);
      // Fallback to exact match pattern
      this.regex = new RegExp(`^${path.replace(/:[\w-]+/g, '[^/]+')}$`);
      console.error(`Using fallback pattern: ${this.regex}`);
    }
  }
  
  match(url: URL): { match: boolean; params: Record<string, string> } {
    const pathname = url.pathname;
    const match = pathname.match(this.regex);
    
    if (!match) {
      return { match: false, params: {} };
    }
    
    // Extract parameters
    const params: Record<string, string> = {};
    const paramValues = match.slice(1); // Skip the full match at index 0
    
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      if (typeof part !== 'string' && i < paramValues.length) {
        params[part.name] = paramValues[i];
      }
    }
    
    return { match: true, params };
  }
}

interface Route {
  pattern: PathPattern;
  method: HttpMethod;
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];
  
  // Add a middleware to the router
  use(middleware: Middleware): Router {
    this.middlewares.push(middleware);
    return this;
  }

  // Register a route with the router
  register(method: HttpMethod, path: string, handler: RouteHandler): Router {
    this.routes.push({
      pattern: new PathPattern(path),
      method,
      handler,
    });
    return this;
  }

  // Convenience methods for common HTTP methods
  get(path: string, handler: RouteHandler): Router {
    return this.register("GET", path, handler);
  }

  post(path: string, handler: RouteHandler): Router {
    return this.register("POST", path, handler);
  }

  put(path: string, handler: RouteHandler): Router {
    return this.register("PUT", path, handler);
  }

  delete(path: string, handler: RouteHandler): Router {
    return this.register("DELETE", path, handler);
  }

  // Handle incoming requests
  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method as HttpMethod;

    // Apply middlewares
    const executeMiddleware = async (index: number): Promise<Response> => {
      if (index >= this.middlewares.length) {
        // If we've executed all middlewares, proceed to route handling
        return this.handleRoute(request, url, method);
      }

      // Execute the middleware and pass control to the next one
      const middleware = this.middlewares[index];
      return middleware(request, () => executeMiddleware(index + 1));
    };

    try {
      return await executeMiddleware(0);
    } catch (error) {
      // Convert errors to standardized responses
      return applyCorsHeaders(createErrorResponse(error));
    }
  }

  // Handle route matching and execution
  private async handleRoute(request: Request, url: URL, method: HttpMethod): Promise<Response> {
    console.log(`Handling route: ${method} ${url.pathname}`);
    
    // Find a matching route
    for (const route of this.routes) {
      const { match, params } = route.pattern.match(url);
      if (match && route.method === method) {
        try {
          // Execute the route handler
          const response = await route.handler(request, params);
          
          // Apply CORS headers to response
          return applyCorsHeaders(response);
        } catch (error) {
          return applyCorsHeaders(createErrorResponse(error));
        }
      }
    }

    // No route matched
    return applyCorsHeaders(
      createErrorResponse(
        new AppError(`Route not found: ${method} ${url.pathname}`, 404)
      )
    );
  }
}
