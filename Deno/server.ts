// server.ts

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
import { router as archivedDocsRouter } from "./api/archived-docs.ts"; // Import archived documents router

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
      documents: response.documents,
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
    
    // Format the data in a frontend-friendly way
    const formattedAuthors = authors.map(author => {
      return {
        id: author.id, // Keep the UUID as the internal ID for API calls
        spud_id: author.spud_id || '', // Include spud_id for display purposes
        full_name: author.full_name,
        department: author.department || '',
        affiliation: author.affiliation || '',
        email: author.email || '',
        bio: author.biography || '',
        profilePicUrl: author.profile_picture || '',
        // Default to zero works - will be populated by client
        worksCount: 0
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

// API endpoint to fetch archived documents
router.get("/api/archived-docs", async (ctx) => {
  try {
    // Extract query parameters
    const url = new URL(ctx.request.url);
    const rawPage = url.searchParams.get("page") || "1";
    const rawLimit = url.searchParams.get("limit") || "10";
    const sort = url.searchParams.get("sort") || "latest";
    let category = url.searchParams.get("category") || null;
    
    console.log(`[ARCHIVE API] Raw request parameters: page=${rawPage}, limit=${rawLimit}, sort=${sort}, category=${category}`);
    
    // Clean up category parameter
    if (category === "" || category === "All" || category === "undefined" || category === "null") {
      category = null;
    }
    
    // Validate parameters
    const page = parseInt(rawPage);
    const limit = parseInt(rawLimit);
    
    if (isNaN(page) || page < 1) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid page parameter" };
      return;
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid limit parameter" };
      return;
    }
    
    console.log(`[ARCHIVE API] Using page=${page}, limit=${limit}, sort=${sort}, category=${category || 'All'}`);
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // First get all archived compiled documents - these are the "packages"
    const compiledQuery = `
      SELECT 
        cd.id,
        d.title,
        d.document_type,
        d.description,
        d.publication_date,
        d.deleted_at,
        cd.volume,
        cd.start_year,
        cd.end_year,
        cd.category,
        cd.issue_number,
        TRUE as is_compiled,
        TRUE as is_package,
        (
          SELECT COUNT(*) 
          FROM compiled_document_items cdi
          JOIN documents child ON child.id = cdi.document_id
          WHERE cdi.compiled_document_id = cd.id
        ) as total_children_count,
        (
          SELECT COUNT(*) 
          FROM compiled_document_items cdi
          JOIN documents child ON child.id = cdi.document_id
          WHERE cdi.compiled_document_id = cd.id
          AND child.deleted_at IS NOT NULL
        ) as archived_children_count
      FROM 
        compiled_documents cd
      JOIN 
        documents d ON d.id = cd.id
      WHERE 
        (d.deleted_at IS NOT NULL OR cd.deleted_at IS NOT NULL)
        ${category ? 
          "AND (LOWER((d.document_type)::TEXT) = LOWER($1) OR LOWER((cd.category)::TEXT) = LOWER($1))" : ""}
      ORDER BY 
        COALESCE(d.deleted_at, cd.deleted_at) DESC
    `;
    
    const compiledParams = category ? [category] : [];
    console.log(`[ARCHIVE API] Executing compiled query with params:`, compiledParams);
    
    const compiledResult = await client.queryObject(compiledQuery, compiledParams);
    const compiledDocs = compiledResult.rows || [];
    
    console.log(`[ARCHIVE API] Found ${compiledDocs.length} archived compiled documents (packages)`);
    
    // Debug info - log all compiled docs
    compiledDocs.forEach((doc, index) => {
      console.log(`[ARCHIVE API] Compiled document ${index}: id=${doc.id}, title=${doc.title}, docs deleted_at=${doc.deleted_at}, is_compiled=${doc.is_compiled}`);
    });
    
    // Get IDs of all archived compiled documents to use in our exclusion query
    const archivedCompiledIds = compiledDocs.map((doc: any) => doc.id);
    const compiledIdsStr = archivedCompiledIds.length > 0 
      ? archivedCompiledIds.join(',') 
      : "-1"; // Use -1 if there are no compiled docs to avoid SQL error
    
    // Format compiled documents
    for (const doc of compiledDocs) {
      if (!doc || typeof doc !== 'object') continue;
      
      // Make sure is_compiled and is_package flags are properly set to true
      (doc as any).is_compiled = true;
      (doc as any).is_package = true;
      
      // Format title for compiled documents if needed
      if ((doc as any).category) {
        const categoryName = (doc as any).category;
        const volume = (doc as any).volume;
        const issueNumber = (doc as any).issue_number;
        const startYear = (doc as any).start_year;
        const endYear = (doc as any).end_year;
        
        // Only build a formatted title if the existing title doesn't have the proper format
        const currentTitle = (doc as any).title || '';
        if (!currentTitle.includes('Vol.')) {
          let formattedTitle = categoryName;
          
          if (volume) {
            formattedTitle += ` Vol. ${volume}`;
          }
          
          if (issueNumber) {
            formattedTitle += `, Issue No. ${issueNumber}`;
          }
          
          if (startYear) {
            formattedTitle += ` (${startYear}${endYear ? `-${endYear}` : ''})`;
          }
          
          (doc as any).title = formattedTitle;
        }
      }
      
      // Add children counter for the UI
      (doc as any).child_count = (doc as any).archived_children_count || 0;
    }
    
    // Get child documents to display
    const childDocumentsQuery = `
      SELECT 
        d.id,
        d.title,
        d.document_type,
        d.description,
        d.publication_date,
        d.deleted_at,
        cdi.compiled_document_id as parent_compiled_id,
        pd.title as parent_title,
        FALSE as is_compiled,
        TRUE as is_child
      FROM 
        documents d
      JOIN 
        compiled_document_items cdi ON d.id = cdi.document_id
      JOIN
        documents pd ON pd.id = cdi.compiled_document_id
      WHERE 
        d.deleted_at IS NOT NULL
        AND cdi.compiled_document_id IN (${compiledIdsStr})
        ${category ? "AND LOWER((d.document_type)::TEXT) = LOWER($1)" : ""}
      ORDER BY 
        d.deleted_at DESC, d.title ASC
    `;
    
    const childDocParams = category ? [category] : [];
    let childDocs = [];
    
    if (archivedCompiledIds.length > 0) {
      console.log(`[ARCHIVE API] Executing child docs query with params:`, childDocParams);
      const childDocResult = await client.queryObject(childDocumentsQuery, childDocParams);
      childDocs = childDocResult.rows || [];
      console.log(`[ARCHIVE API] Found ${childDocs.length} child documents of archived compiled documents`);
    }
    
    // Get archived regular documents, excluding child documents of archived compiled documents
    const regDocQuery = `
      SELECT 
        d.id,
        d.title,
        d.document_type,
        d.description,
        d.publication_date,
        d.deleted_at,
        d.volume,
        d.issue,
        FALSE as is_compiled,
        FALSE as is_child,
        (
          SELECT cdi.compiled_document_id
          FROM compiled_document_items cdi
          JOIN documents pd ON pd.id = cdi.compiled_document_id AND pd.deleted_at IS NULL
          WHERE cdi.document_id = d.id
          LIMIT 1
        ) as parent_compiled_id,
        (
          SELECT pd.title
          FROM compiled_document_items cdi
          JOIN documents pd ON pd.id = cdi.compiled_document_id AND pd.deleted_at IS NULL
          WHERE cdi.document_id = d.id
          LIMIT 1
        ) as parent_title
      FROM 
        documents d
      WHERE 
        d.deleted_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM compiled_document_items cdi
          WHERE cdi.document_id = d.id
          AND cdi.compiled_document_id IN (${compiledIdsStr})
        )
        ${category ? "AND LOWER((d.document_type)::TEXT) = LOWER($1)" : ""}
      ORDER BY 
        d.deleted_at DESC
    `;
    
    const regDocParams = category ? [category] : [];
    console.log(`[ARCHIVE API] Executing regular docs query with params:`, regDocParams);
    const regDocResult = await client.queryObject(regDocQuery, regDocParams);
    const regDocs = regDocResult.rows || [];
    
    console.log(`[ARCHIVE API] Found ${regDocs.length} archived regular documents`);
    
    // Identify orphaned children (children whose parents are not archived)
    for (const doc of regDocs) {
      if (!doc || typeof doc !== 'object') continue;
      
      // Mark as child document if it has a parent_compiled_id
      if ((doc as any).parent_compiled_id) {
        (doc as any).is_child = true;
      }
    }
    
    // Combine all documents
    const allDocuments = [...compiledDocs, ...childDocs, ...regDocs];
    
    // Count total documents for pagination
    const totalCount = allDocuments.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    
    // Apply pagination
    const paginatedDocuments = allDocuments.slice(offset, offset + limit);
    
    console.log(`[ARCHIVE API] Returning ${paginatedDocuments.length} archived documents (page ${page} of ${totalPages})`);
    
    // Return data with expected field names for client compatibility
    ctx.response.status = 200;
    ctx.response.body = { 
      documents: paginatedDocuments,
      totalDocuments: totalCount,
      total_pages: totalPages,  // Match the field name expected by the client
      current_page: page,       // Match the field name expected by the client
      limit,
      category: category || 'All'
    };
    
  } catch (error) {
    console.error("[ARCHIVE API] Error fetching archived documents:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to fetch archived documents",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
});

// Restore archived document
router.post("/api/documents/:id/restore", async (ctx) => {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    // Check if document exists and is deleted
    const checkQuery = "SELECT * FROM documents WHERE id = $1 AND deleted_at IS NOT NULL";
    const checkResult = await client.queryObject(checkQuery, [id]);
    
    // If document isn't marked as deleted in documents table, check compiled_documents
    if (checkResult.rows.length === 0) {
      // Check if it's a compiled document marked as deleted in the compiled_documents table
      const checkCompiledQuery = `
        SELECT d.id, d.title, cd.deleted_at as cd_deleted_at
        FROM documents d 
        JOIN compiled_documents cd ON d.id = cd.id
        WHERE d.id = $1 AND cd.deleted_at IS NOT NULL
      `;
      const checkCompiledResult = await client.queryObject(checkCompiledQuery, [id]);
      
      if (checkCompiledResult.rows.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Archived document not found" };
        return;
      }
      
      // Document is a compiled document with deleted_at in compiled_documents
      console.log(`Found document ${id} marked as deleted in compiled_documents table`);
    }
    
    // Check if this is a compiled document
    const compiledCheckQuery = "SELECT id FROM compiled_documents WHERE id = $1";
    const compiledCheckResult = await client.queryObject(compiledCheckQuery, [id]);
    const isCompiled = compiledCheckResult.rows.length > 0;
    const childDocuments = [];
    
    // Start a transaction to ensure all operations succeed or fail together
    await client.queryObject("BEGIN");
    
    try {
      if (isCompiled) {
        console.log(`Restoring compiled document with ID: ${id}`);
        
        // Get the list of child documents for informational purposes
        const childDocQuery = `
          SELECT d.id, d.title 
          FROM documents d 
          JOIN compiled_document_items cdi ON d.id = cdi.document_id 
          WHERE cdi.compiled_document_id = $1
        `;
        const childDocResult = await client.queryObject(childDocQuery, [id]);
        
        if (childDocResult.rows.length > 0) {
          childDocuments.push(...childDocResult.rows);
          console.log(`Child documents that will be restored with parent:`, 
            childDocResult.rows.map((row: any) => `${row.id}: ${row.title}`).join(', ')
          );
          
          // Restore all child documents as well (clear deleted_at)
          const restoreChildrenQuery = `
            UPDATE documents SET deleted_at = NULL
            WHERE id IN (
              SELECT document_id FROM compiled_document_items 
              WHERE compiled_document_id = $1
            )
          `;
          await client.queryObject(restoreChildrenQuery, [id]);
          console.log(`Restored ${childDocResult.rows.length} child documents of compiled document ${id}`);
        }
        
        // Also update the compiled_documents table to clear deleted_at
        const restoreCompiledQuery = `
          UPDATE compiled_documents SET deleted_at = NULL
          WHERE id = $1
          RETURNING id
        `;
        const restoreCompiledResult = await client.queryObject(restoreCompiledQuery, [id]);
        console.log(`Updated compiled document entry: `, restoreCompiledResult.rows);
      }
      
      // Restore document by setting deleted_at to null
      const restoreQuery = "UPDATE documents SET deleted_at = NULL WHERE id = $1 RETURNING *";
      const restoreResult = await client.queryObject(restoreQuery, [id]);
      
      if (restoreResult.rows.length === 0) {
        // If no rows were updated in documents table, the document might not have been marked as deleted there
        console.log(`No rows updated in documents table for ${id}, document might only be marked in compiled_documents`);
      } else {
        console.log(`Document ${id} successfully restored in documents table`);
      }
      
      // Commit transaction
      await client.queryObject("COMMIT");
      
      ctx.response.status = 200;
      ctx.response.body = {
        message: isCompiled 
          ? `Compiled document and ${childDocuments.length} child documents restored successfully` 
          : "Document restored successfully",
        document: restoreResult.rows[0] || {id},
        is_compiled: isCompiled,
        child_count: childDocuments.length,
        child_documents: childDocuments
      };
    } catch (error) {
      // Rollback transaction if anything failed
      await client.queryObject("ROLLBACK");
      console.error(`Error during restore operation for document ${id}:`, error);
      throw error;
    }
  } catch (error) {
    console.error("Error restoring document:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = {
      error: "An error occurred while restoring the document",
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Soft delete a document
router.delete("/api/documents/:id/soft-delete", async (ctx) => {
  try {
    const id = ctx.params.id;
    console.log(`[ARCHIVE API] Attempting to soft-delete document with ID: ${id}`);
    
    if (!id) {
      console.log("[ARCHIVE API] No document ID provided");
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    // First check if document already deleted
    const checkDeletedQuery = "SELECT deleted_at FROM documents WHERE id = $1";
    const checkDeletedResult = await client.queryObject(checkDeletedQuery, [id]);
    console.log(`[ARCHIVE API] Check deleted result:`, checkDeletedResult.rows);
    
    if (checkDeletedResult.rows.length > 0 && checkDeletedResult.rows[0].deleted_at) {
      console.log(`[ARCHIVE API] Document ID ${id} is already archived with deleted_at=${checkDeletedResult.rows[0].deleted_at}`);
      ctx.response.status = 400;
      ctx.response.body = { error: "Document is already archived" };
      return;
    }
    
    // Check if document exists 
    const checkQuery = "SELECT * FROM documents WHERE id = $1";
    const checkResult = await client.queryObject(checkQuery, [id]);
    console.log(`[ARCHIVE API] Check result for document ID ${id}:`, checkResult.rows);
    
    if (checkResult.rows.length === 0) {
      console.log(`[ARCHIVE API] Document ID ${id} not found`);
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }
    
    // Check if document is a child document of a compiled document
    const childCheckQuery = `
      SELECT * FROM compiled_document_items
      WHERE document_id = $1
    `;
    const childCheckResult = await client.queryObject(childCheckQuery, [id]);
    console.log(`[ARCHIVE API] Child check result for document ID ${id}:`, childCheckResult.rows);
    
    if (childCheckResult.rows.length > 0) {
      // This is a child document, prevent individual deletion
      console.log(`[ARCHIVE API] Document ID ${id} is a child document of compilation ${childCheckResult.rows[0].compiled_document_id}`);
      ctx.response.status = 400;
      ctx.response.body = { 
        error: "Cannot archive individual child documents", 
        message: "To archive this document, please archive the parent compiled document.",
        parent_id: childCheckResult.rows[0].compiled_document_id
      };
      return;
    }
    
    // Check if document is a compiled document
    const compiledCheckQuery = `
      SELECT id FROM compiled_documents 
      WHERE id = $1
    `;
    const compiledCheckResult = await client.queryObject(compiledCheckQuery, [id]);
    console.log(`[ARCHIVE API] Compiled check result for document ID ${id}:`, compiledCheckResult.rows);
    
    const isCompiled = compiledCheckResult.rows.length > 0;
    let childDocuments: any[] = [];
    
    // Start transaction for clean operations
    await client.queryObject("BEGIN");
    try {
      // If compiled, need to handle differently
      if (isCompiled) {
        console.log(`[ARCHIVE API] Document ID ${id} is a compiled document - proceeding with archiving`);
        
        // For compiled documents, get the list of child documents for informational purposes
        const childDocQuery = `
          SELECT d.id, d.title 
          FROM documents d 
          JOIN compiled_document_items cdi ON d.id = cdi.document_id 
          WHERE cdi.compiled_document_id = $1
        `;
        const childDocResult = await client.queryObject(childDocQuery, [id]);
        
        if (childDocResult.rows.length > 0) {
          childDocuments.push(...childDocResult.rows);
          console.log(`[ARCHIVE API] Child documents that will be archived with parent:`, 
            childDocResult.rows.map((row: any) => `${row.id}: ${row.title}`).join(', ')
          );
          
          // Archive all child documents as well (set deleted_at)
          const archiveChildrenQuery = `
            UPDATE documents SET deleted_at = CURRENT_TIMESTAMP
            WHERE id IN (
              SELECT document_id FROM compiled_document_items 
              WHERE compiled_document_id = $1
            )
            RETURNING id, deleted_at
          `;
          const archiveChildrenResult = await client.queryObject(archiveChildrenQuery, [id]);
          console.log(`[ARCHIVE API] Archived ${childDocResult.rows.length} child documents of compiled document ${id}. Results:`, archiveChildrenResult.rows);
          
          // CRITICAL FIX: Also update the compiled_documents table to set deleted_at
          // This ensures the parent document is properly marked as archived
          const archiveCompiledDocQuery = `
            UPDATE compiled_documents SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, deleted_at
          `;
          const archiveCompiledResult = await client.queryObject(archiveCompiledDocQuery, [id]);
          console.log(`[ARCHIVE API] Updated compiled_documents entry: `, archiveCompiledResult.rows);
        }
      }
      
      // Soft delete the document by setting deleted_at to current timestamp
      const deleteQuery = "UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
      const deleteResult = await client.queryObject(deleteQuery, [id]);
      console.log(`[ARCHIVE API] Soft delete result for document ID ${id}:`, deleteResult.rows);
      
      if (deleteResult.rows.length === 0) {
        throw new Error(`Failed to archive document ${id}`);
      }
      
      // Commit the transaction if everything succeeded
      await client.queryObject("COMMIT");
      
      // Verify the document is now properly deleted
      const verifyQuery = "SELECT deleted_at FROM documents WHERE id = $1";
      const verifyResult = await client.queryObject(verifyQuery, [id]);
      if (verifyResult.rows.length > 0 && verifyResult.rows[0].deleted_at) {
        console.log(`[ARCHIVE API] Verified document ${id} now has deleted_at=${verifyResult.rows[0].deleted_at}`);
      } else {
        console.warn(`[ARCHIVE API] WARNING: Failed to verify deletion of document ${id}`);
      }
      
      // ADDITIONAL CHECK: If this is a compiled document, verify it's properly marked in both tables
      if (isCompiled) {
        const verifyCompiledQuery = "SELECT deleted_at FROM compiled_documents WHERE id = $1";
        const verifyCompiledResult = await client.queryObject(verifyCompiledQuery, [id]);
        
        if (verifyCompiledResult.rows.length > 0 && verifyCompiledResult.rows[0].deleted_at) {
          console.log(`[ARCHIVE API] Verified compiled document ${id} has deleted_at set in compiled_documents table`);
        } else {
          console.warn(`[ARCHIVE API] WARNING: compiled_documents entry for ${id} may not be properly marked as deleted`);
        }
      }
      
      ctx.response.status = 200;
      ctx.response.body = { 
        message: "Document archived successfully", 
        document_id: id,
        is_compiled: isCompiled,
        child_count: childDocuments.length,
        child_documents: childDocuments,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      // Roll back transaction if anything failed
      await client.queryObject("ROLLBACK");
      console.error(`[ARCHIVE API] Error while archiving document ${id}:`, error);
      ctx.response.status = 500;
      ctx.response.body = { 
        error: "Failed to archive document", 
        message: error instanceof Error ? error.message : String(error)
      };
      return;
    }
    
  } catch (error) {
    console.error(`[ARCHIVE API] Error in soft-delete endpoint:`, error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Server error", 
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

// Endpoint to fetch archived child documents of a compiled document
router.get("/api/documents/:id/archived-children", async (ctx) => {
  try {
    // Get document ID from URL parameters
    const documentId = ctx.params.id;
    if (!documentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }

    console.log(`Fetching archived child documents for compiled document: ${documentId}`);
    
    // First check if the requested document is a compiled document
    const compiledCheckQuery = `
      SELECT cd.id, d.deleted_at 
      FROM compiled_documents cd 
      JOIN documents d ON d.id = cd.id 
      WHERE cd.id = $1
    `;
    
    const compiledDoc = await client.queryObject(compiledCheckQuery, [documentId]);
    
    if (compiledDoc.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Compiled document not found" };
      return;
    }
    
    // Get all child documents of this compiled document that are archived (have deleted_at set)
    const childQuery = `
      SELECT 
        d.id,
        d.title,
        d.document_type,
        d.description,
        d.publication_date,
        d.deleted_at
      FROM 
        documents d
      JOIN 
        compiled_document_items cdi ON cdi.document_id = d.id
      WHERE 
        cdi.compiled_document_id = $1
        AND d.deleted_at IS NOT NULL
      ORDER BY 
        d.title ASC
    `;
    
    const result = await client.queryObject(childQuery, [documentId]);
    const childDocuments = result.rows || [];
    
    console.log(`Found ${childDocuments.length} archived child documents for compiled document: ${documentId}`);
    
    // Get authors for each child document
    for (const doc of childDocuments) {
      if (!doc || typeof doc !== 'object') continue;
      
      const authorsQuery = `
        SELECT 
          a.id, a.first_name, a.last_name
        FROM 
          authors a
        JOIN 
          document_authors da ON da.author_id = a.id
        WHERE 
          da.document_id = $1
      `;
      
      const authors = await client.queryObject(authorsQuery, [(doc as any).id]);
      (doc as any).authors = authors.rows || [];
    }
    
    ctx.response.status = 200;
    ctx.response.body = { 
      documents: childDocuments,
      parentId: documentId
    };
    
  } catch (error) {
    console.error("Error fetching archived child documents:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Failed to fetch archived child documents",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
});

// Endpoint to fetch parent document info for a child document
router.get("/api/documents/:id/parent-info", async (ctx) => {
  try {
    const documentId = ctx.params.id;
    
    if (!documentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    console.log(`Fetching parent document info for document ID: ${documentId}`);
    
    // Check if this is a child document in a compilation
    const checkQuery = `
      SELECT 
        cdi.compiled_document_id,
        pd.title as parent_title,
        pd.deleted_at
      FROM 
        compiled_document_items cdi
      JOIN 
        documents pd ON pd.id = cdi.compiled_document_id
      WHERE 
        cdi.document_id = $1
      LIMIT 1
    `;
    
    const result = await client.queryObject(checkQuery, [documentId]);
    
    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { 
        error: "No parent document found",
        message: "This document is not part of a compilation"
      };
      return;
    }
    
    const parentInfo = result.rows[0];
    
    ctx.response.status = 200;
    ctx.response.body = {
      child_id: documentId,
      parent_id: parentInfo.compiled_document_id,
      parent_title: parentInfo.parent_title,
      parent_deleted_at: parentInfo.deleted_at
    };
    
  } catch (error) {
    console.error("Error fetching parent document info:", error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "Failed to fetch parent document info",
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

// Debug endpoint to check compiled documents
router.get("/api/debug/compiled-docs", async (ctx) => {
  try {
    // Query to find all compiled documents regardless of deleted status
    const compiledQuery = `
      SELECT 
        cd.id,
        d.title,
        d.document_type,
        d.deleted_at,
        TRUE as is_compiled,
        TRUE as is_package,
        (
          SELECT COUNT(*) 
          FROM compiled_document_items cdi
          WHERE cdi.compiled_document_id = cd.id
        ) as child_count
      FROM 
        compiled_documents cd
      JOIN 
        documents d ON d.id = cd.id
      ORDER BY 
        d.deleted_at DESC NULLS FIRST
      LIMIT 20
    `;
    
    const result = await client.queryObject(compiledQuery);
    const compiledDocs = result.rows || [];
    
    // Count documents with deleted_at
    const archivedCount = compiledDocs.filter((doc: any) => doc.deleted_at).length;
    
    ctx.response.status = 200;
    ctx.response.body = {
      total_compiled: compiledDocs.length,
      archived_compiled: archivedCount,
      documents: compiledDocs
    };
  } catch (error) {
    console.error("Error in debug endpoint:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to fetch debug information",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
});

// Debug endpoint to check document types
router.get("/api/debug/document-types", async (ctx) => {
  try {
    // Query to get all enum values for document_type
    const enumQuery = `
      SELECT 
        pg_enum.enumlabel 
      FROM 
        pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
      WHERE 
        pg_type.typname = 'document_type'
      ORDER BY 
        pg_enum.enumlabel
    `;
    
    const result = await client.queryObject(enumQuery);
    const types = result.rows || [];
    
    ctx.response.status = 200;
    ctx.response.body = {
      document_types: types.map((row: any) => row.enumlabel),
      count: types.length
    };
  } catch (error) {
    console.error("Error fetching document types:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to fetch document types",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
});

// Register document author routes
app.use(documentAuthorRoutes.routes());
app.use(documentAuthorRoutes.allowedMethods());

// Register archived documents routes
app.use(archivedDocsRouter.routes());
app.use(archivedDocsRouter.allowedMethods());

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

startServer();