/**
 * Main server file - implements a clean, modular architecture
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { serveFile } from "https://deno.land/std@0.218.2/http/file_server.ts";
import { ensureDir, exists } from "https://deno.land/std@0.178.0/fs/mod.ts";
import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Import middleware
import { handleCorsPreflightRequest, applyCorsHeaders } from "./middleware/cors.ts";
import { checkAuth } from "./middleware/auth_middleware.ts";

// Import routers
import authorRouter from "./routes/author-routes.ts";
import documentsRouter from "./routes/documents-Routes.ts";
import adminRouter from "./routes/admin-routes.ts";

// Import API routers using Oak
import authorsApiRouter from "./api/authors.ts";
import topicsApiRouter from "./api/topics.ts";

// Import login handler
import { handleLoginRequest } from "./routes/login.ts";
import { handleLogout } from "./routes/logout.ts";
import { handleSidebar } from "./routes/side_bar.ts";

// Import error handling utilities
import { AppError, createErrorResponse } from "./utils/errors.ts";

// Import database connection
import { client } from "./data/denopost_conn.ts";

// Import document upload handlers
import { handleSingleDocumentUpload } from "./controllers/single-document-upload.ts";
import { handleCompiledDocumentUpload } from "./controllers/compiled-document-upload.ts";

// Load environment variables
const env = await load({ envPath: "./.env" });
console.log("Loaded Environment Variables:", env);

// Set server port
const PORT = 8000;

// List of protected routes that require authentication
const protectedRoutes = [
  "/admin/dashboard.html",
  "/admin/documents.html",
  "/admin/settings.html",
  "/admin/upload_doc.html",
  "/admin/upload-receipt.html",
  "/admin/create-news-article.html",
  "/admin/admin_logs.html",
  "/admin/add_author.html",
  "/admin/document-permission.html",
  "/admin/Components/side_bar.html",
  "/admin/Components/navbar_header.html",
  "/admin/Components/page_header.html"
];

// Ensure static directories exist
await ensureDir("./static");
await ensureDir("./static/js");

// Set up Oak application
const app = new Application();

// Set up API routes with Oak
app.use(authorsApiRouter.routes());
app.use(authorsApiRouter.allowedMethods());
app.use(topicsApiRouter.routes());
app.use(topicsApiRouter.allowedMethods());
app.use(adminRouter.routes());
app.use(adminRouter.allowedMethods());
// Don't use documentsRouter directly due to version mismatch

/**
 * Main request handler function
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  console.log(`Request: ${method} ${path}`);

  try {
    // Handle OPTIONS requests (CORS preflight)
    if (method === "OPTIONS") {
      return handleCorsPreflightRequest();
    }

    // Handle login request
    if (path === "/login") {
      if (method === "OPTIONS") {
        // Handle preflight request for login
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          },
        });
      } else if (method === "POST") {
        try {
          console.log("Processing login request");
          const response = await handleLoginRequest(req);
          return applyCorsHeaders(response);
        } catch (error) {
          console.log(`Login error:`, error);
          return applyCorsHeaders(
            new Response(JSON.stringify({ message: "Login processing error", details: error instanceof Error ? error.message : String(error) }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          );
        }
      }
    }
    
    // Handle logout request
    if (path === "/logout") {
      if (method === "GET") {
        // Redirect GET requests to POST by client-side JavaScript
        return new Response(
          `<script>
            fetch('/logout', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'}
            }).then(() => {
              window.location.href = '/index.html';
            });
          </script>
          <p>Logging out...</p>`,
          {
            status: 200,
            headers: { "Content-Type": "text/html" }
          }
        );
      } else if (method === "POST") {
        return applyCorsHeaders(await handleLogout(req));
      }
    }
    
    // Handle sidebar request
    if (path === "/side_bar" && method === "GET") {
      return applyCorsHeaders(await handleSidebar(req));
    }

    // Special case for dashboard.html - serve directly without CORS
    if (path === "/admin/dashboard.html") {
      console.log("Direct dashboard.html handler activated");
      try {
        // Try direct file serving
        const dashboardPath = "./admin/dashboard.html";
        console.log(`Serving dashboard from ${dashboardPath}`);
        const response = await serveFile(req, dashboardPath);
        // Explicitly set content-type to text/html
        const headers = new Headers(response.headers);
        headers.set("Content-Type", "text/html");
        return new Response(response.body, {
          status: response.status,
          headers: headers
        });
      } catch (error) {
        console.error(`Failed to serve dashboard.html: ${error instanceof Error ? error.message : String(error)}`);
        // Fallback to redirect to index page
        return new Response(
          `<!DOCTYPE html>
          <html>
          <head>
            <meta http-equiv="refresh" content="0;url=/index.html">
            <title>Redirecting...</title>
          </head>
          <body>
            <h1>Could not load dashboard</h1>
            <p>Redirecting to home page...</p>
          </body>
          </html>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html"
            }
          }
        );
      }
    }

    // Check authentication for protected routes
    if (protectedRoutes.includes(path)) {
      const authCheckResult = await checkAuth(req);
      if (!authCheckResult.ok) {
        return applyCorsHeaders(authCheckResult.response);
      }
    }

    // Handle HTML files from admin directory - DON'T apply CORS headers directly
    if (path.startsWith("/admin/") && (path.endsWith(".html") || path === "/admin/")) {
      try {
        // Try different path variations to find the file
        const possiblePaths = [
          `./admin${path.replace('/admin', '')}`, // Path within admin directory
          `.${path}`,  // Direct path
          `./admin/${path.split('/').pop()}` // Just the filename in admin directory
        ];
        
        for (const tryPath of possiblePaths) {
          console.log(`Trying to serve admin HTML file from: ${tryPath}`);
          try {
            const response = await serveFile(req, tryPath);
            console.log(`Found and serving admin file from: ${tryPath}`);
            return response;
          } catch (error) {
            // Continue to the next path
            console.log(`File not found at ${tryPath}, trying next path`);
          }
        }
        
        // If we get here, we couldn't find the file
        console.error(`No matching admin file found for ${path}`);
        return new Response(`Admin file not found: ${path}`, { status: 404 });
      } catch (error) {
        console.error(`Error serving admin HTML file ${path}:`, error instanceof Error ? error.message : String(error));
        return new Response(`Admin file not found: ${path}`, { status: 404 });
      }
    }

    // Special handling for admin resources (CSS, JS, images)
    if (path.startsWith("/admin/components/") || path.startsWith("/admin/Components/")) {
      try {
        // Try case variations (components vs Components)
        const tryPaths = [
          `.${path}`, // Try direct path
          `./admin${path.substring("/admin".length)}`, // Without double 'admin' prefix
          `.${path.replace('/components/', '/Components/')}`, // Try with uppercase C
          `.${path.replace('/Components/', '/components/')}` // Try with lowercase c
        ];
        
        for (const tryPath of tryPaths) {
          console.log(`Trying to serve admin component from: ${tryPath}`);
          try {
            const response = await serveFile(req, tryPath);
            console.log(`Found and serving admin component from: ${tryPath}`);
            return response;
          } catch (error) {
            // Continue to the next path
          }
        }

        console.error(`Admin component not found for ${path}`);
        return new Response(`Admin component not found: ${path}`, { status: 404 });
      } catch (error) {
        console.error(`Error serving admin component ${path}:`, error instanceof Error ? error.message : String(error));
        return new Response(`Admin component not found: ${path}`, { status: 404 });
      }
    }
    
    // Handle CSS files when requested with relative paths
    if (path.endsWith(".css")) {
      try {
        // If it's a plain css file request without full path, try various locations
        const cssFileName = path.split('/').pop();
        // Log the requested path for debugging
        console.log(`CSS request received for: ${path}`);
        
        // Specifically handle the webflow-style.css case 
        if (path === "/components/css/webflow-style.css") {
          try {
            console.log("Attempting to serve webflow-style.css from Components directory");
            const response = await serveFile(req, "./Public/Components/css/webflow-style.css");
            console.log("Successfully serving webflow-style.css from Components directory");
            return response;
          } catch (error) {
            console.error("Failed to serve from Components directory:", error);
            // Continue to other paths
          }
        }
        
        const possibleCssPaths = [
          `.${path}`,  // Original path
          `./Public${path}`, // Try in Public directory
          `.${path.replace(/\/components\//i, "/Components/")}`, // Try with uppercase C in components
          `./Public${path.replace(/\/components\//i, "/Components/")}`, // Try in Public with uppercase C
          `./admin/Components/css/${cssFileName}`, // Admin components css
          `./admin/components/css/${cssFileName}`, // Lowercase variant
          `./admin/css/${cssFileName}`, // Directly in admin folder
          `./Public/css/${cssFileName}`, // Public css folder
          `./Public/Components/css/${cssFileName}`, // Public components css folder
          `./Public/components/css/${cssFileName}`, // Lowercase variant
        ];
        
        // Try case insensitive matching for components path
        if (path.toLowerCase().includes("/components/")) {
          const normalizedPath = path.replace(/components/i, "Components");
          possibleCssPaths.unshift(`./Public${normalizedPath}`);  // Try with proper case in Public folder
          possibleCssPaths.unshift(`.${normalizedPath}`);  // Try with proper case
        }
        
        console.log(`Looking for CSS file: ${cssFileName} in multiple locations`);
        
        for (const cssPath of possibleCssPaths) {
          try {
            console.log(`Trying to serve CSS from: ${cssPath}`);
            const fileExists = await exists(cssPath);
            if (fileExists) {
              console.log(`Found CSS file at: ${cssPath}`);
              const response = await serveFile(req, cssPath);
              console.log(`Successfully serving CSS from: ${cssPath}`);
              return response;
            }
          } catch (error) {
            // Continue to next path
          }
        }
        
        // If we get here, we couldn't find the CSS file
        console.error(`CSS file not found: ${cssFileName}`);
        return new Response(`CSS file not found: ${cssFileName}`, { status: 404 });
      } catch (error) {
        console.error(`Error serving CSS file: ${error instanceof Error ? error.message : String(error)}`);
        return new Response(`Error serving CSS file: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
      }
    }

    // Handle HTML files from Public directory - DON'T apply CORS headers directly
    if ((path.endsWith(".html") || path === "/") && !path.startsWith("/api/")) {
      try {
        let filePath = path === "/" ? "./Public/index.html" : `./Public${path}`;
        console.log(`Serving public HTML file from: ${filePath}`);
        return await serveFile(req, filePath);
      } catch (error) {
        console.error(`Error serving public HTML file ${path}:`, error instanceof Error ? error.message : String(error));
        return new Response(`Public file not found: ${path}`, { status: 404 });
      }
    }

    // Handle other static files from Public directory
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/) && !path.startsWith("/api/")) {
      try {
        // Fix path for Public files - avoid double Public prefix
        let filePath;
        if (path.startsWith("/Public/")) {
          filePath = `.${path}`; // Already has Public prefix
        } else {
          filePath = `./Public${path}`; // Add Public prefix
        }
        
        console.log(`Serving static file from: ${filePath}`);
        try {
          return await serveFile(req, filePath);
        } catch (error) {
          console.log(`File not found at ${filePath}, trying fallback paths`);
          
          // Try alternate paths
          const fileName = path.split('/').pop() || '';
          const alternativePaths = [
            `./Public/js/${fileName}`,     // Direct in Public/js
            `./admin/js/${fileName}`       // Direct in admin/js
          ];
          
          for (const altPath of alternativePaths) {
            try {
              const fileExists = await exists(altPath);
              if (fileExists) {
                console.log(`✓ Found static file at: ${altPath}`);
                return await serveFile(req, altPath);
              }
            } catch {
              // Continue to next path
            }
          }
          
          // If all fallbacks fail, return 404
          console.error(`File not found in any location: ${path}`);
          return new Response(`File not found: ${path}`, { status: 404 });
        }
      } catch (error) {
        console.error(`Error serving static file ${path}:`, error instanceof Error ? error.message : String(error));
        return new Response(`File not found: ${path}`, { status: 404 });
      }
    }

    // Handle static files (JS, CSS, images)
    if (path.startsWith("/static/js/")) {
      try {
        // Remove duplicated path components and try multiple locations
        const fileName = path.split('/').pop() || '';
        console.log(`Trying to serve static JS file: ${fileName}`);
        
        // Check multiple possible paths in this specific order
        const possiblePaths = [
          `./Deno/static/js/${fileName}`,  // Explicit Deno path
          `./static/js/${fileName}`,       // Root relative path
          `.${path}`                       // Direct path
        ];
        
        console.log("Checking these paths:");
        for (const tryPath of possiblePaths) {
          console.log(`- ${tryPath}`);
          try {
            const fileExists = await exists(tryPath);
            if (fileExists) {
              console.log(`✓ Found static file at: ${tryPath}`);
              return await serveFile(req, tryPath);
            }
            console.log(`✗ File not found at: ${tryPath}`);
          } catch (pathError) {
            console.log(`✗ Error checking path ${tryPath}: ${pathError instanceof Error ? pathError.message : String(pathError)}`);
          }
        }

        console.error(`Could not find static JS file ${path} in any location`);
        return new Response(`Static JS file not found: ${path}`, { status: 404 });
      } catch (error) {
        console.error(`Error serving static JS file ${path}:`, error instanceof Error ? error.message : String(error));
        return new Response(`Static JS file not found: ${path}`, { status: 404 });
      }
    }
    
    // Handle image files
    if (path.startsWith("/images/")) {
      try {
        // Try to serve from Public images directory first
        const publicImagePath = `./Public${path}`;
        console.log(`Trying to serve image from: ${publicImagePath}`);
        return await serveFile(req, publicImagePath);
      } catch (error) {
        try {
          // Fallback to admin images directory
          const adminImagePath = `./admin${path}`;
          console.log(`Trying to serve image from: ${adminImagePath}`);
          return await serveFile(req, adminImagePath);
        } catch (error) {
          console.error(`Error serving image ${path}:`, error instanceof Error ? error.message : String(error));
          return new Response(`Image not found: ${path}`, { status: 404 });
        }
      }
    }

    // Handle static files
    if (path.startsWith("/static/")) {
      try {
        const filePath = `./Deno${path}`;
        console.log(`Serving static file from: ${filePath}`);
        return await serveFile(req, filePath);
      } catch (error) {
        // Fallback to the direct path if the Deno-prefixed path doesn't work
        try {
          const directPath = `.${path}`;
          console.log(`Fallback: serving static file from: ${directPath}`);
          return await serveFile(req, directPath);
        } catch (secondError) {
          console.error(`Error serving static file ${path}:`, secondError instanceof Error ? secondError.message : String(secondError));
          return new Response(`File not found: ${path}`, { status: 404 });
        }
      }
    }

    // Handle API routes
    if (path.startsWith("/api/")) {
      // For API routes that should be handled by Oak (/api/authors and /api/topics)
      if (path.startsWith("/api/authors") || path.startsWith("/api/topics")) {
        // Convert the Request to Oak Context and let Oak handle it
        return await handleWithOak(req);
      }
      
      // Handle document upload separately due to Oak version mismatch
      if (path === "/api/upload-document" && method === "POST") {
        try {
          console.log("Processing document upload request");
          
          const formData = await req.formData();
          const uploadMode = formData.get("upload_mode")?.toString();
          
          console.log("Upload mode:", uploadMode);
          
          // Our handler only uses ctx.response, so we only need to mock that part
          // Using 'any' type to avoid TypeScript errors with incompatible Oak versions
          const ctx: any = {
            response: {
              status: 200,
              body: null,
              headers: new Headers()
            }
          };
          
          if (uploadMode === 'compiled') {
            // Handle compiled document upload
            await handleCompiledDocumentUpload(ctx, formData);
          } else {
            // Handle single document upload
            await handleSingleDocumentUpload(ctx, formData);
          }
          
          // Convert ctx to a Response
          return new Response(
            JSON.stringify(ctx.response.body), 
            { 
              status: ctx.response.status,
              headers: applyCorsHeaders(new Response()).headers
            }
          );
        } catch (error) {
          console.error("Error handling document upload:", error instanceof Error ? error.message : String(error));
          return applyCorsHeaders(new Response(
            JSON.stringify({ 
              success: false,
              message: "Error processing upload request", 
              error: error instanceof Error ? error.message : String(error)
            }),
            { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          ));
        }
      }
      
      // Handle document routes
      if (path.startsWith("/api/documents") ||
          path.startsWith("/api/categories") ||
          path.startsWith("/api/volumes")) {
        // TODO: Refactor document routes to use our new Router system
        // For now, handle these routes in a legacy way to maintain compatibility
        return handleLegacyDocumentRoutes(req, path, method);
      }
      
      // If no API route matched
      return applyCorsHeaders(
        createErrorResponse(
          new AppError(`API endpoint not found: ${method} ${path}`, 404)
        )
      );
    }

    // Serve PDF files
    if (path.startsWith("/filepathpdf/")) {
      const fileName = path.split("/").pop();
      if (!fileName) {
        return new Response("Invalid file path", { status: 400 });
      }
      try {
        return await serveFile(req, `./filepathpdf/${fileName}`);
      } catch (error) {
        console.error(`Error serving PDF file ${fileName}:`, error instanceof Error ? error.message : String(error));
        return new Response(`File not found: ${fileName}`, { status: 404 });
      }
    }

    // Special handling for React build files
    if (path.startsWith("/build/")) {
      console.log(`Serving React build file from: ${path}`);
      try {
        // Remove leading slash and serve from project root
        const filePath = `.${path}`;
        console.log(`Trying to serve from: ${filePath}`);
        const response = await serveFile(req, filePath);
        
        // Set proper content type based on file extension
        const headers = new Headers(response.headers);
        if (path.endsWith(".js")) {
          headers.set("Content-Type", "application/javascript");
        } else if (path.endsWith(".css")) {
          headers.set("Content-Type", "text/css");
        } else if (path.endsWith(".json")) {
          headers.set("Content-Type", "application/json");
        }
        
        return new Response(response.body, {
          status: response.status,
          headers: headers
        });
      } catch (error) {
        console.error(`Failed to serve React build file: ${error instanceof Error ? error.message : String(error)}`);
        return new Response("File not found", { status: 404 });
      }
    }

    // Handle API requests for volume filtering
    if (path === "/api/documents" && method === "GET") {
      const url = new URL(req.url);
      const category = url.searchParams.get("category");
      const volume = url.searchParams.get("volume");
      
      console.log(`API Request for documents - Category: ${category}, Volume: ${volume}`);
      
      try {
        return await handleLegacyDocumentRoutes(req, path, method);
      } catch (error) {
        console.error(`Error handling documents API: ${error instanceof Error ? error.message : String(error)}`);
        return applyCorsHeaders(
          new Response(JSON.stringify({ error: "Failed to process document request" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          })
        );
      }
    }

    // If no route matched
    return new Response(`Not found: ${path}`, { status: 404 });
  } catch (error) {
    console.error(`Unhandled server error:`, error instanceof Error ? error.message : String(error));
    return applyCorsHeaders(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
  }
}

/**
 * Handle a request using Oak middleware
 */
async function handleWithOak(req: Request): Promise<Response> {
  return await app.handle(req) || new Response("Not found", { status: 404 });
}

/**
 * Temporary function to handle legacy document routes
 * (This will be refactored in a future update)
 */
async function handleLegacyDocumentRoutes(req: Request, path: string, method: string): Promise<Response> {
  try {
    // Import necessary modules for document handling
    const { fetchCategories, fetchDocuments } = await import("./controllers/document-Controller.ts");

    // Handle categories route
    if (path === "/api/categories" && method === "GET") {
      return await fetchCategories();
    }

    // Handle documents route
    if (path.startsWith("/api/documents") && method === "GET") {
      return await fetchDocuments(req);
    }

    // Handle specific document routes
    if (path.match(/\/api\/documents\/\d+/) && method === "GET") {
      // Pass to documents router for handling
      // This is a bit hacky but will be refactored later
      return new Response("Document endpoint needs refactoring", { status: 501 });
    }

    // Return 404 for unhandled document routes
    return applyCorsHeaders(
      createErrorResponse(
        new AppError(`Document endpoint not found: ${method} ${path}`, 404)
      )
    );
  } catch (error) {
    console.error(`Error handling legacy document route:`, error instanceof Error ? error.message : String(error));
    return applyCorsHeaders(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
  }
}

/**
 * Start the HTTP server
 */
async function startServer() {
  console.log(`Starting server on port ${PORT}...`);
  await serve(handler, { port: PORT });
}

// Start the server
startServer();
