// server.ts

// Load environment variables from .env file
import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
// Load env variables with absolute path to ensure it's found
config({ 
  path: "D:/Documents/Capstone/Peas/paulinian-electronic-archiving-system/deno/.env", 
  export: true 
});
console.log("Environment variables loaded from .env file");
console.log("SMTP Username:", Deno.env.get("SMTP_USERNAME"));
console.log("SMTP Password set:", Deno.env.get("SMTP_PASSWORD") ? "Yes" : "No");

// -----------------------------
// SECTION: Imports
// -----------------------------
import { Application, Router, FormDataReader } from "./deps.ts";
import { ensureDir } from "https://deno.land/std@0.190.0/fs/ensure_dir.ts";
import { connectToDb, diagnoseDatabaseIssues } from "./db/denopost_conn.ts"; // Using connectToDb from conn.ts
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
import { getCategories } from "./controllers/categoryController.ts";
import { getChildDocuments } from "./controllers/documentController.ts";
import { getDocumentAuthors } from "./controllers/documentAuthorController.ts";
import { AuthorModel } from "./models/authorModel.ts";
import { DocumentModel } from "./models/documentModel.ts";
import { ResearchAgendaModel } from "./models/researchAgendaModel.ts";
import { unifiedArchiveRoutes, unifiedArchiveAllowedMethods } from "./routes/unifiedArchiveRoutes.ts";
import { authRoutes } from "./routes/authRoutes.ts"; // Import auth routes
import { createDocumentRequestRoutes } from "./routes/documentRequestRoutes.ts";
import { DocumentRequestModel } from "./models/documentRequestModel.ts";
import { DocumentRequestController } from "./controllers/documentRequestController.ts";
import { emailRoutes } from "./routes/emailRoutes.ts"; // Import email routes

// -----------------------------
// SECTION: Configuration
// -----------------------------
const PORT = Deno.env.get("PORT") || 8000;

// -----------------------------
// SECTION: Server Setup
// -----------------------------
const app = new Application();
const router = new Router();
// Record when the server started
export const SERVER_START_TIME = Date.now();

// Update the cachedServerStartTime in authRoutes if possible
try {
  // Use dynamic import to get the module
  import("./routes/authRoutes.ts").then(authRoutesModule => {
    // Check if the module exports a function to set server time
    if (authRoutesModule.setServerStartTime) {
      authRoutesModule.setServerStartTime(SERVER_START_TIME);
    } else {
      console.warn("authRoutes.ts does not export setServerStartTime function");
    }
  }).catch(err => {
    console.error("Failed to update auth routes with server start time:", err);
  });
} catch (error) {
  console.error("Error updating auth routes with server start time:", error);
}

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

// Register email routes
emailRoutes.forEach(route => {
  const method = route.method.toLowerCase();
  if (method === 'post') {
    router.post(route.path, route.handler);
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
    const url = new URL(ctx.request.url);
    const rawPage = url.searchParams.get("page") || "1";
    const rawLimit = url.searchParams.get("size") || "10";
    const sort = url.searchParams.get("sort") || "latest";
    const category = url.searchParams.get("category") || null;
    const search = url.searchParams.get("search") || null;
    
    console.log(`[SERVER] Document request: page=${rawPage}, size=${rawLimit}, sort=${sort}, category=${category || 'All'}, search=${search || 'none'}`);
    
    // Validate page and limit parameters
    const page = parseInt(rawPage);
    const limit = parseInt(rawLimit);
    
    if (isNaN(page) || page < 1) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid page parameter" };
      return;
    }
    
    if (isNaN(limit) || limit < 1 || limit > 50) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid limit parameter" };
      return;
    }
    
    const response = await fetchDocuments({
      page,
      limit,
      category,
      search,
      sort: sort === "latest" ? "publication_date" : "publication_date",
      order: sort === "latest" ? "DESC" : "ASC"
    });
    
    console.log(`[SERVER] Got ${response.documents?.length || 0} documents from database`);
    
    // Detailed logging
    if (response.documents && response.documents.length > 0) {
      console.log(`[SERVER] First few documents from DB:`);
      response.documents.slice(0, 3).forEach(doc => {
        console.log(`[SERVER] Document ID=${doc.id}, Title="${doc.title}", is_compiled=${doc.is_compiled}, deleted_at=${doc.deleted_at || 'NULL'}`);
      });
    }
    
    // Make sure all documents are filtered to exclude deleted items
    if (response.documents) {
      console.log(`[SERVER] Starting to filter ${response.documents.length} documents`);
      
      // Check for compiled documents that might be deleted
      const filteredDocuments = response.documents.filter(doc => {
        // Debug
        console.log(`[SERVER] Filtering document ID=${doc.id}, deleted_at=${doc.deleted_at || 'NULL'}, is_compiled=${doc.is_compiled}`);
        
        // If document has deleted_at timestamp, it should be filtered out
        if (doc.deleted_at) {
          console.warn(`[SERVER] Filtering out document ${doc.id} with deleted_at set: ${doc.deleted_at}`);
          return false;
        }
        
        // For compiled documents, check the delete status differently
        if (doc.is_compiled === true) {
          console.log(`[SERVER] Special check for compiled document ${doc.id}, deleted_at=${doc.deleted_at || 'NULL'}`);
          // Only filter out if we know for sure it's deleted
          if (doc.deleted_at !== null && doc.deleted_at !== undefined) {
            console.warn(`[SERVER] Filtering out compiled document ${doc.id} with deleted_at set`);
            return false;
          }
          // If deleted_at is null/undefined, keep the document
          console.log(`[SERVER] Keeping compiled document ${doc.id} (deleted_at is ${doc.deleted_at === null ? 'null' : 'undefined'})`);
          return true;
        }
        
        console.log(`[SERVER] Keeping regular document ${doc.id} (no deleted_at)`);
        return true;
      });
      
      // Log any discrepancies
      if (filteredDocuments.length !== response.documents.length) {
        console.warn(`[SERVER] Filtered out ${response.documents.length - filteredDocuments.length} deleted documents that were incorrectly returned`);
      } else {
        console.log(`[SERVER] No documents were filtered out`);
      }
      
      // Replace documents with filtered list
      response.documents = filteredDocuments;
    }
    
    // Return the data
    ctx.response.body = {
      documents: response.documents.map(doc => {
        // Ensure each document has author_names field populated
        let authors = [];
        if (doc.authors && Array.isArray(doc.authors)) {
          authors = doc.authors.map(a => a.full_name || `Author ${a.id}`);
        }
        
        return {
          ...doc,
          author_names: authors.length > 0 ? authors : []
        };
      }),
      totalPages: response.totalPages,
      totalDocuments: response.totalCount,
      page
    };
    console.log(`[SERVER] Finished processing request, returning ${response.documents?.length || 0} documents`);
  } catch (error) {
    console.error("[SERVER] Error fetching documents:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to fetch documents",
      details: error instanceof Error ? error.message : "Unknown error"
    };
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
    console.log(`Server: Handling request for child documents of document ID: ${docId}`);
    
    // Convert context to Request for the controller
    const request = new Request(`${ctx.request.url.origin}/api/documents/${docId}/children`, {
      method: "GET",
      headers: ctx.request.headers
    });
    
    // Use the document controller to handle the request
    const response = await getChildDocuments(request);
    
    // Set response from controller
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
  } catch (error) {
    console.error(`Error handling child documents request:`, error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Failed to fetch child documents",
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

// Add the departments endpoint to your router
router.get("/api/departments", getDepartments);

// Add categories endpoint to router
router.get("/api/categories", getCategories);

// Add document-authors endpoint
router.get("/api/document-authors/:documentId", async (ctx) => {
  try {
    const documentId = ctx.params.documentId;
    console.log(`Server: Handling request for authors of document ID: ${documentId}`);
    
    // Get document authors from the controller
    const authors = await getDocumentAuthors(documentId);
    
    ctx.response.status = 200;
    ctx.response.body = {
      document_id: documentId,
      authors_count: authors.length,
      authors: authors
    };
  } catch (error) {
    console.error(`Error fetching authors for document ${ctx.params.documentId}:`, error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to fetch document authors",
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Add endpoint to get all authors
router.get("/api/authors/all", async (ctx) => {
  try {
    console.log("Server: Handling request for all authors");
    
    // Import AuthorModel dynamically to avoid circular dependencies
    const { AuthorModel } = await import("./models/authorModel.ts");
    
    // Get all authors from the model
    const authors = await AuthorModel.getAll();
    
    // Get work counts for each author
    const authorWorksCountQuery = `
      SELECT author_id, COUNT(document_id) as works_count 
      FROM document_authors 
      GROUP BY author_id
    `;
    const authorWorksResult = await client.queryObject(authorWorksCountQuery);
    
    // Create a map of author ID to works count
    const authorWorksMap = new Map();
    authorWorksResult.rows.forEach((row: any) => {
      authorWorksMap.set(row.author_id, parseInt(row.works_count, 10));
    });
    
    // Format the data in a frontend-friendly way
    const formattedAuthors = authors.map(author => {
      // Get works count from map or default to 0
      const worksCount = authorWorksMap.get(author.id) || 0;
      
      return {
        id: author.id, // Keep the UUID as the internal ID for API calls
        spud_id: author.spud_id || '', // Include spud_id for display purposes
        full_name: author.full_name,
        department: author.department || '',
        affiliation: author.affiliation || '',
        email: author.email || '',
        bio: author.biography || '',
        profilePicUrl: author.profile_picture || '',
        // Populate with actual work count from database
        worksCount: worksCount
      };
    });
    
    ctx.response.status = 200;
    ctx.response.body = {
      count: authors.length,
      authors: formattedAuthors
    };
  } catch (error) {
    console.error("Error fetching all authors:", error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: error instanceof Error ? error.message : "Unknown error", 
      authors: [] 
    };
  }
});

// Add endpoint to get works (documents) authored by a specific author
router.get("/api/authors/:authorId/works", async (ctx) => {
  const authorId = ctx.params.authorId;

  if (!authorId) {
      ctx.response.status = 400;
    ctx.response.body = { error: "Author ID is required" };
      return;
    }
    
  console.log(`Fetching works for author ID: ${authorId}`);
  
  try {
    // Get document IDs authored by this author
    const docIds = await AuthorModel.getDocuments(authorId);

    // Get full document details for each ID
    const works = [];
    for (const docId of docIds) {
      const doc = await DocumentModel.getById(docId);
      if (doc) {
        console.log(`Processing document ${docId}, type: ${doc.document_type}`);
        
        // Get topics for this document
        const topicsQuery = `
          SELECT ra.id, ra.name
          FROM research_agenda ra
          JOIN document_research_agenda dra ON ra.id = dra.research_agenda_id
          WHERE dra.document_id = $1
        `;
        try {
          const topicsResult = await client.queryObject(topicsQuery, [docId]);
          // Add topics to document using type assertion
          (doc as any).topics = topicsResult.rows.map((topic: any) => ({
            id: topic.id,
            name: topic.name || '',
          }));
          console.log(`Found ${(doc as any).topics.length} topics directly for document ${docId}`);
        } catch (error) {
          console.error(`Error fetching topics for document ${docId}:`, error instanceof Error ? error.message : String(error));
          (doc as any).topics = [];
        }

        // Get category directly from document_type field
        let categoryName = 'N/A';
        if (doc.document_type) {
          // Convert document_type enum to a readable category name
          switch(doc.document_type) {
            case 'THESIS':
              categoryName = 'Thesis';
              break;
            case 'DISSERTATION':
              categoryName = 'Dissertation';
              break;
            case 'CONFLUENCE':
              categoryName = 'Confluence';
              break;
            case 'SYNERGY':
              categoryName = 'Synergy';
              break;
            default:
              categoryName = doc.document_type;
          }
          console.log(`Using document_type "${doc.document_type}" as category for document ${docId}`);
        }

        // If no topics, but we might have research agendas elsewhere
        // Skip the category_research_agenda query since that table doesn't exist

        // Format work for frontend consumption
        works.push({
          id: doc.id,
          title: doc.title,
          // Format dates based on document type
          year: formatDocumentDate(doc),
          category: categoryName,
          // Join research agenda topics for display
          researchAgenda: (doc as any).topics && (doc as any).topics.length > 0 
            ? (doc as any).topics.map((t: any) => t.name).join(', ') 
            : 'N/A',
          // Add URL for document viewing if needed
          url: `/document/${doc.id}`,
          // Include original document data if needed
          document: doc
        });
      }
    }

    // Helper function to format document dates based on type
    function formatDocumentDate(doc: any): string {
      console.log(`Formatting date for document type: ${doc.document_type}, pub date: ${doc.publication_date}, start: ${doc.start_year}, end: ${doc.end_year}`);
      
      // For single documents (THESIS or DISSERTATION) with publication date
      if (doc.publication_date && (doc.document_type === 'THESIS' || doc.document_type === 'DISSERTATION')) {
        try {
          const date = new Date(doc.publication_date);
          // Format as Month Year (e.g., "May 2023")
          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch (e) {
          console.error("Error formatting publication date:", e);
          return String(doc.publication_date);
        }
      }
      
      // For compiled documents (CONFLUENCE or SYNERGY) with start and end years
      if ((doc.document_type === 'CONFLUENCE' || doc.document_type === 'SYNERGY')) {
        if (doc.start_year && doc.end_year) {
          return `${doc.start_year} - ${doc.end_year}`;
        } else if (doc.start_year) {
          return String(doc.start_year);
        }
      }
      
      // Fallback: Use any available date info
      if (doc.publication_date) {
        try {
          const date = new Date(doc.publication_date);
          return date.getFullYear().toString();
        } catch (e) {
          return String(doc.publication_date);
        }
      } else if (doc.start_year) {
        return String(doc.start_year);
      }
      
      return 'N/A';
    }

    ctx.response.status = 200;
    ctx.response.body = {
      authorId,
      works_count: works.length,
      worksCount: works.length, // Include both formats for backward compatibility
      works,
    };
  } catch (error) {
    console.error('Error fetching author works:', error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch author works',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

// Check and synchronize compiled document authors
router.get("/api/compiled-documents/:compiledDocId/sync-authors", async (ctx) => {
  const compiledDocId = ctx.params.compiledDocId;

  if (!compiledDocId) {
      ctx.response.status = 400;
    ctx.response.body = { error: "Compiled document ID is required" };
      return;
    }
    
  console.log(`Synchronizing authors for compiled document ID: ${compiledDocId}`);
  
  try {
    // Get child documents for this compiled document
    const childDocsResponse = await fetchChildDocuments(compiledDocId);
    const childDocs = childDocsResponse.documents;

    if (!childDocs || childDocs.length === 0) {
    ctx.response.status = 200;
      ctx.response.body = { 
        message: 'No child documents found for this compiled document',
        compiledDocId,
        childCount: 0
      };
      return;
    }

    // Track all authors across all child documents
    const authorMap = new Map();
    
    // Process each child document to collect all authors
    for (const doc of childDocs) {
      console.log(`Processing child document: ${doc.id} with ${doc.authors.length} authors`);
      
      // Process each author of this document
      for (const author of doc.authors) {
        if (!authorMap.has(author.id)) {
          // Store the author ID and name if we haven't seen this author before
          authorMap.set(author.id, author.full_name);
        }
      }
    }

    // Convert the author map to an array
    const uniqueAuthors = Array.from(authorMap).map(([id, name]) => ({
      id,
      full_name: name
    }));

    console.log(`Found ${uniqueAuthors.length} unique authors across ${childDocs.length} child documents`);

    ctx.response.status = 200;
    ctx.response.body = {
      compiledDocId,
      childCount: childDocs.length,
      authorCount: uniqueAuthors.length,
      authors: uniqueAuthors,
      status: 'success'
    };
  } catch (error) {
    console.error('Error synchronizing compiled document authors:', error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to synchronize compiled document authors',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

// Add endpoint to update author information
router.put("/api/authors/:authorId", async (ctx) => {
  const authorId = ctx.params.authorId;
  
  if (!authorId) {
      ctx.response.status = 400;
    ctx.response.body = { error: "Author ID is required" };
      return;
    }
    
  try {
    // Parse the request body
    const body = ctx.request.body();
    if (body.type !== "json") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body must be JSON" };
      return;
    }
    
    const authorData = await body.value;
    
    // Check if the author exists
    const existingAuthor = await AuthorModel.getById(authorId);
    if (!existingAuthor) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Author not found" };
      return;
    }
    
    // If trying to change ID, check if the new ID already exists
    if (authorData.newId && authorData.newId !== authorId) {
      const duplicateCheck = await AuthorModel.getById(authorData.newId);
      if (duplicateCheck) {
        ctx.response.status = 409; // Conflict
        ctx.response.body = { error: "The new ID is already in use" };
        return;
      }
    }
    
    // Prepare update data
    const updateData: any = {
      full_name: authorData.full_name || authorData.full_name,
      department: authorData.department || null,
      affiliation: authorData.affiliation || null,
      email: authorData.email || null,
      biography: authorData.bio || null,
      profile_picture: authorData.profilePicUrl || null
    };
    
    // Add spud_id to update data if provided
    if (authorData.spud_id !== undefined) {
      updateData.spud_id = authorData.spud_id || null;
    }
    
    // Update the author in the database
    await AuthorModel.update(authorId, updateData);
    
    // Handle ID change if requested
    if (authorData.newId && authorData.newId !== authorId) {
      await AuthorModel.updateId(authorId, authorData.newId);
    }
    
    // Return the updated author
    const updatedAuthor = await AuthorModel.getById(authorData.newId || authorId);
    
    ctx.response.status = 200;
    ctx.response.body = {
      message: "Author updated successfully",
      author: updatedAuthor
    };
  } catch (error) {
    console.error(`Error updating author ${authorId}:`, error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
});

// Add authors endpoint
router.post("/api/document-research-agenda/link", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.document_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    if (!body.agenda_items || !Array.isArray(body.agenda_items) || body.agenda_items.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "At least one agenda item is required" };
      return;
    }
    
    console.log(`Linking ${body.agenda_items.length} research agenda items to document ${body.document_id}`);
    
    const result = await ResearchAgendaModel.linkItemsToDocumentByName(
      parseInt(body.document_id.toString()),
      body.agenda_items
    );
    
    if (result.success) {
    ctx.response.status = 200;
    ctx.response.body = { 
        message: `Linked ${result.linkedIds.length} research agenda items to document ${body.document_id}`,
        linked_items: result.linkedIds
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to link research agenda items to document" };
    }
  } catch (error) {
    console.error("Error linking research agenda items:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Failed to link research agenda items",
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Register document author routes
app.use(documentAuthorRoutes.routes());
app.use(documentAuthorRoutes.allowedMethods());

// Register file routes
app.use(fileRoutes.routes());
app.use(fileRoutes.allowedMethods());

// Add router to app
app.use(router.routes());
app.use(router.allowedMethods());

// Add Author routes
app.use(authorRoutes);

// Add Research Agenda routes
app.use(researchAgendaRoutes);

// Register unified archive routes
app.use(unifiedArchiveRoutes);
app.use(unifiedArchiveAllowedMethods);

// Log that unified archive API is available
console.log("Unified Archive API routes registered");

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
      filePath: "/" + fileResult.path.replace(/\\/g, "/"),
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
// SECTION: Directory Setup
// -----------------------------
// Create required directories for storage
async function setupDirectories() {
  console.log("Setting up storage directories...");
  
  try {
    // Create main storage directory
    await ensureDir("./storage");
    
    // Create subdirectories for different document types
    await ensureDir("./storage/uploads");
    await ensureDir("./storage/documents");
    await ensureDir("./storage/single/thesis");
    await ensureDir("./storage/single/dissertation");
    await ensureDir("./storage/compiled/confluence");
    await ensureDir("./storage/compiled/synergy");
    await ensureDir("./storage/research_studies");
    
    console.log("Storage directories created successfully");
  } catch (error) {
    console.error("Error creating storage directories:", error);
    throw new Error(`Failed to create storage directories: ${error.message}`);
  }
}

// -----------------------------
// SECTION: Server Startup
// -----------------------------
async function startServer() {
  try {
    // Setup storage directories
    await setupDirectories();
    
    // Connect to the database
    console.log("Connecting to database...");
    await connectToDb();
    
    // Run database diagnostics
    await diagnoseDatabaseIssues();
    
    // Register routes with the application
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    // Start the server
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    await app.listen({ port: Number(PORT) });
  } catch (error) {
    console.error("Failed to start server:", error);
    Deno.exit(1);
  }
}

router.get('/api/affiliations', async (ctx) => {
  try {
    // Get distinct affiliations from authors table
    const result = await client.queryObject(
      "SELECT DISTINCT affiliation FROM authors WHERE affiliation IS NOT NULL ORDER BY affiliation"
    );
    
    ctx.response.status = 200;
    ctx.response.type = "json";
    ctx.response.body = result.rows.map((row: any) => row.affiliation);
  } catch (error) {
    console.error("Error fetching affiliations:", error);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
});

// Add a server ping endpoint for client health checks
router.get("/ping", (ctx) => {
    ctx.response.status = 200;
    ctx.response.body = {
        status: "ok",
        serverStartTime: SERVER_START_TIME
    };
});

// Initialize document request system
const documentRequestModel = new DocumentRequestModel(client);
const documentRequestController = new DocumentRequestController(documentRequestModel, DocumentModel);
const documentRequestRoutes = createDocumentRequestRoutes(documentRequestController);

// Add document request routes
app.use(documentRequestRoutes.routes());
app.use(documentRequestRoutes.allowedMethods());

// Add an endpoint to view email logs for document requests (admin only)
router.get("/api/email-logs", async (ctx) => {
  try {
    // Get user info from auth header
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized: Authentication required" };
      return;
    }
    
    // Extract token
    const token = authHeader.split(" ")[1];
    
    // Check if user is admin
    try {
      // We'll use the verification function from authRoutes
      const { verifySession } = await import("./routes/authRoutes.ts");
      const session = await verifySession(token);
      
      if (!session || session.role !== "admin") {
        ctx.response.status = 403;
        ctx.response.body = { error: "Forbidden: Admin access required" };
        return;
      }
    } catch (err) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid authentication token" };
      return;
    }
    
    // Get date from query parameter or use today
    const url = new URL(ctx.request.url);
    const dateParam = url.searchParams.get("date");
    const date = dateParam || new Date().toISOString().split('T')[0];
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid date format. Please use YYYY-MM-DD format" };
      return;
    }
    
    // Construct log file path
    const logFile = `./logs/email-activity-${date}.log`;
    
    try {
      // Check if file exists
      await Deno.stat(logFile);
    } catch (error) {
      ctx.response.status = 404;
      ctx.response.body = { 
        error: `No log file found for ${date}`,
        date: date
      };
      return;
    }
    
    // Read log file
    const logContent = await Deno.readTextFile(logFile);
    
    // Parse logs
    const logEntries = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // Filter for document sending activities
    const documentActivities = logEntries.filter(entry => 
      entry.action.startsWith('DOCUMENT_')
    );
    
    // Calculate statistics
    const successful = documentActivities.filter(e => e.action === 'DOCUMENT_SENT_SUCCESS').length;
    const failed = documentActivities.filter(e => 
      e.action === 'DOCUMENT_SENT_FAILURE' || e.action === 'DOCUMENT_SENT_ERROR'
    ).length;
    
    // Return logs and statistics
    ctx.response.status = 200;
    ctx.response.body = {
      date: date,
      total: documentActivities.length,
      successful: successful,
      failed: failed,
      logs: documentActivities
    };
    
  } catch (error) {
    console.error("Error retrieving email logs:", error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Server error while retrieving email logs",
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

startServer();