// server.ts

// -----------------------------
// SECTION: Imports
// -----------------------------
import { Application, Router, FormDataReader } from "./deps.ts";
import { ensureDir } from "https://deno.land/std@0.190.0/fs/ensure_dir.ts";
import { connectToDb } from "./db/denopost_conn.ts"; // DB connection (PostgreSQL)
import { client } from "./db/denopost_conn.ts"; // Client for database queries
import { routes } from "./routes/index.ts"; // All route handlers in one file
import { authorRoutes } from "./routes/authorRoutes.ts"; // Import author routes directly
import { researchAgendaRoutes } from "./routes/researchAgendaRoutes.ts"; // Import research agenda routes directly
import { saveFile } from "./services/uploadService.ts"; // Import file upload service
import { extractPdfMetadata } from "./services/pdfService.ts"; // Import PDF service
import { fetchDocuments, fetchChildDocuments } from "./services/documentService.ts"; // Import document service
import documentAuthorRoutes from "./routes/documentAuthorRoutes.ts";
import fileRoutes from "./routes/fileRoutes.ts"; // Import file routes
import { handler as categoryHandler } from "./api/category.ts"; // Import category handler
import { getDepartments } from "./api/departments.ts";
import { handleCreateDocument } from "./api/document.ts"; // Import document creation handler

// -----------------------------
// SECTION: Configuration
// -----------------------------
const PORT = Deno.env.get("PORT") || 8000;

// -----------------------------
// SECTION: Server Setup
// -----------------------------
const app = new Application();
const router = new Router();

// -----------------------------
// SECTION: Middleware (Optional)
// -----------------------------
// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Server error:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Internal server error",
      error: err.message
    };
  }
});

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// Add static file serving middleware
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// Add static file serving middleware for storage directory
app.use(async (ctx, next) => {
  // Check if the request is for a file in the storage directory
  if (ctx.request.url.pathname.startsWith('/storage/')) {
    try {
      // Remove leading slash
      const path = ctx.request.url.pathname.substring(1);
      console.log(`Attempting to serve file: ${path}`);
      
      await ctx.send({
        root: Deno.cwd(),
        path,
      });
    } catch (err) {
      console.error(`Error serving file from storage: ${err.message}`);
      await next();
    }
  } else {
    await next();
  }
});

// You can add other global middleware here (e.g., logging, body parsers, etc.)

// -----------------------------
// SECTION: Routes Setup
// -----------------------------

// Register all routes with the router
routes.forEach(route => {
  const method = route.method.toLowerCase();
  if (method === 'get') {
    router.get(route.path, route.handler);
  } else if (method === 'post') {
    router.post(route.path, route.handler);
  } else if (method === 'put') {
    router.put(route.path, route.handler);
  } else if (method === 'delete') {
    router.delete(route.path, route.handler);
  }
});

// Add category routes
router.get("/api/category", async (ctx) => {
  const request = new Request(ctx.request.url.toString(), {
    method: ctx.request.method,
    headers: ctx.request.headers
  });
  
  const response = await categoryHandler(request);
  
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
  ctx.response.body = await response.json();
});

// Add document routes directly
router.get("/api/documents", async (ctx) => {
  try {
    // Extract query parameters
    const category = ctx.request.url.searchParams.get("category");
    const page = parseInt(ctx.request.url.searchParams.get("page") || "1");
    const size = parseInt(ctx.request.url.searchParams.get("size") || "20");
    const sort = ctx.request.url.searchParams.get("sort") || "latest";
    
    console.log(`Handling /api/documents request with params: category=${category}, page=${page}, size=${size}, sort=${sort}`);
    
    // Use the document service to fetch documents
    const responseData = await fetchDocuments(category || undefined, page, size, sort);
    
    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = responseData;
  } catch (error) {
    console.error("Error handling documents request:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Add POST endpoint for document creation
router.post("/api/documents", async (ctx) => {
  try {
    // Get JSON body from request
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Convert context to Request for the handler
    const request = new Request(ctx.request.url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    // Use the document creation handler
    const response = await handleCreateDocument(request);
    
    // Set response attributes
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
  } catch (error) {
    console.error("Error creating document:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Add endpoint for child documents
router.get("/api/documents/:id/children", async (ctx) => {
  try {
    const docId = ctx.params.id;
    console.log(`Handling request for child documents of document ID: ${docId}`);
    
    // Use the document service to fetch child documents
    const responseData = await fetchChildDocuments(docId);
    
    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = responseData;
  } catch (error) {
    console.error(`Error handling child documents request for ID ${ctx.params.id}:`, error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Add the departments endpoint to your router
router.get("/api/departments", getDepartments);

// Add router to app
app.use(router.routes());
app.use(router.allowedMethods());

// Add Author routes
app.use(authorRoutes);

// Add Research Agenda routes
app.use(researchAgendaRoutes);

// Add Document-Author routes
app.use(documentAuthorRoutes.routes());
app.use(documentAuthorRoutes.allowedMethods());

// Add File routes
app.use(fileRoutes.routes());
app.use(fileRoutes.allowedMethods());

// -----------------------------
// SECTION: File Upload Route
// -----------------------------
// Add a route for file uploads
router.post("/api/upload", async (ctx) => {
  try {
    // Check if content type is multipart/form-data
    const contentType = ctx.request.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Content-Type must be multipart/form-data" };
      return;
    }
    
    // Get form data with increased size limits for larger files
    const form = await ctx.request.body({ type: "form-data" }).value;
    const data = await form.read({ 
      maxFileSize: 100_000_000, // 100MB limit
      maxSize: 120_000_000 // 120MB total form limit
    });
    
    // Get file from form data
    let file = data.files?.[0];
    
    if (!file) {
      // Look for the file in a field named "file" if no files array is found
      for (const [key, value] of Object.entries(data.fields)) {
        if (key === "file" && value) {
          // If the value is a file-like object
          if (typeof value === "object" && (value.name || value.filename)) {
            file = value;
            break;
          }
        }
      }
      
      if (!file) {
        ctx.response.status = 400;
        ctx.response.body = { error: "No file provided in the request" };
        return;
      }
    }
    
    // Check if file has required properties
    if (!file.name && !file.filename) {
      file.name = "unnamed_file";
    }
    
    // Get storage path from form data
    const storagePath = data.fields.storagePath || "storage/uploads";
    
    // Log detailed information for debugging
    console.log("Upload request details:");
    console.log("- File name:", file.name || file.filename);
    console.log("- File size:", file.size, "bytes");
    console.log("- Storage path:", storagePath);
    console.log("- Temporary path:", file.path);
    
    // Ensure the path has a trailing slash
    const normalizedPath = storagePath.endsWith("/") ? storagePath : `${storagePath}/`;
    
    // Make sure the directory exists before saving
    try {
      await ensureDir(normalizedPath);
      console.log(`- Directory ${normalizedPath} ensured`);
    } catch (dirError) {
      console.error(`- Failed to create directory ${normalizedPath}:`, dirError);
      throw new Error(`Could not create storage directory: ${dirError.message}`);
    }
    
    // Save file
    const fileResult = await saveFile(file, normalizedPath);
    
    // Verify file was saved
    try {
      const stat = await Deno.stat(fileResult.path);
      console.log(`- File successfully verified at ${fileResult.path} (${stat.size} bytes)`);
    } catch (statError) {
      console.error(`- Warning: Could not verify file at ${fileResult.path}:`, statError);
    }
    
    // Extract metadata if it's a PDF file
    let metadata = null;
    const isPdf = (file.name || file.filename || "").toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      console.log("- Extracting PDF metadata...");
      try {
        metadata = await extractPdfMetadata(fileResult.path);
        console.log("- PDF metadata extracted:", metadata);
      } catch (metadataError) {
        console.error("- Error extracting PDF metadata:", metadataError);
        // Continue even if metadata extraction fails
      }
    }
    
    // Return response with file path and metadata
    ctx.response.status = 200;
    ctx.response.body = {
      message: "File uploaded successfully",
      filePath: fileResult.path,
      originalName: fileResult.name,
      size: fileResult.size,
      metadata: metadata || null,
      fileType: isPdf ? "pdf" : "other"
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to upload file",
      details: error.message
    };
  }
});

// -----------------------------
// SECTION: Document Metadata Update Route
// -----------------------------
// Add a route to update document metadata after processing
router.put("/api/documents/:id/metadata", async (ctx) => {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    // Get request body
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Create a request to the document update endpoint
    const updateRequest = new Request(`${ctx.request.url.origin}/documents/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    // Forward to the document update handler
    const updateResponse = await fetch(updateRequest);
    
    // Return the response
    ctx.response.status = updateResponse.status;
    ctx.response.body = await updateResponse.json();
    
  } catch (error) {
    console.error("Error updating document metadata:", error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Failed to update document metadata",
      details: error.message
    };
  }
});

// -----------------------------
// SECTION: Directory Management Route
// -----------------------------
// Add a route to ensure directories exist
router.post("/api/ensure-directory", async (ctx) => {
  try {
    // Get the path from request body
    const body = await ctx.request.body({ type: "json" }).value;
    const { path } = body;
    
    if (!path) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Path is required" };
      return;
    }
    
    // Prevent access to sensitive directories
    if (path.includes("..") || !path.startsWith("storage/")) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Invalid directory path" };
      return;
    }
    
    console.log(`Ensuring directory exists: ${path}`);
    
    // Create the directory
    await ensureDir(path);
    
    ctx.response.status = 200;
    ctx.response.body = { 
      message: "Directory created successfully",
      path
    };
  } catch (error) {
    console.error("Error creating directory:", error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Failed to create directory",
      details: error.message
    };
  }
});

// -----------------------------
// SECTION: Server Startup
// -----------------------------
console.log(`Server is running at http://localhost:${PORT}`);
try {
await connectToDb(); // Make sure DB is connected before serving
  console.log("Database connection successful");
} catch (dbError) {
  console.error("Database connection failed, but server will continue:", dbError);
}

await app.listen({ port: +PORT }); // Start the Oak server
