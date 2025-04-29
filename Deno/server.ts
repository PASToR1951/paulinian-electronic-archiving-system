// server.ts

// -----------------------------
// SECTION: Imports
// -----------------------------
import { Application, Router, FormDataReader } from "./deps.ts";
import { ensureDir } from "https://deno.land/std@0.190.0/fs/ensure_dir.ts";
import { connectToDb } from "./db/denopost_conn.ts"; // DB connection (PostgreSQL)
import { routes } from "./routes/index.ts"; // All route handlers in one file
import { authorRoutes } from "./routes/authorRoutes.ts"; // Import author routes directly
import { researchAgendaRoutes } from "./routes/researchAgendaRoutes.ts"; // Import research agenda routes directly
import { saveFile } from "./services/uploadService.ts"; // Import file upload service
import { extractPdfMetadata } from "./services/pdfService.ts"; // Import PDF service

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

// Add router to app
app.use(router.routes());
app.use(router.allowedMethods());

// Add Author routes
app.use(authorRoutes);

// Add Research Agenda routes
app.use(researchAgendaRoutes);

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
    
    // Get form data
    const form = await ctx.request.body({ type: "form-data" }).value;
    const data = await form.read({ maxFileSize: 10_000_000 }); // 10MB limit
    
    // Get file and storage path
    const file = data.files?.[0];
    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = { error: "No file provided" };
      return;
    }
    
    // Get storage path from form data
    const storagePath = data.fields.storagePath || "storage/uploads";
    
    // Log detailed information for debugging
    console.log("Upload request details:");
    console.log("- File name:", file.name);
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
    const filePath = await saveFile(file, normalizedPath);
    
    // Verify file was saved
    try {
      const stat = await Deno.stat(filePath);
      console.log(`- File successfully verified at ${filePath} (${stat.size} bytes)`);
    } catch (statError) {
      console.error(`- Warning: Could not verify file at ${filePath}:`, statError);
    }
    
    // Extract metadata if it's a PDF file
    let metadata = null;
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      console.log("- Extracting PDF metadata...");
      try {
        metadata = await extractPdfMetadata(filePath);
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
      filePath,
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
