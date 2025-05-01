import { DocumentModel } from "../models/documentModel.ts";
import type { Request } from "../deps.ts";
import { client } from "../db/denopost_conn.ts";
import { fetchDocuments as fetchDocumentsService, fetchChildDocuments as fetchChildDocumentsService } from "../services/documentService.ts";

/**
 * Fetch categories from the database
 */
export async function fetchCategories(): Promise<Response> {
  try {
    const result = await client.queryObject(
      "SELECT id, category_name as name, (SELECT COUNT(*) FROM documents WHERE category_id = categories.id AND deleted_at IS NULL) as count FROM categories ORDER BY category_name"
    );
    
    // Process the data to handle BigInt values before serialization
    const processedRows = result.rows.map(row => {
      // Create a new object with all properties from the original row
      const processed = {...row};
      
      // Convert any BigInt values to regular numbers
      if (typeof processed.count === 'bigint') {
        processed.count = Number(processed.count);
      }
      if (typeof processed.id === 'bigint') {
        processed.id = Number(processed.id);
      }
      
      return processed;
    });
    
    return new Response(JSON.stringify(processedRows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Handle GET request to fetch documents with filtering and pagination
 * @param request The fetch request object
 * @returns Response object with documents data
 */
export async function fetchDocuments(request: Request): Promise<Response> {
  try {
    console.log("DocumentController: fetchDocuments called");
    
    // Get URL parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "10");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "latest";
    
    console.log(`Fetching documents with page=${page}, size=${size}, category=${category}, sort=${sort}`);
    
    // ADDITIONAL DEBUGGING: Check if database client is available
    if (!client) {
      console.error("CRITICAL ERROR: Database client is null or undefined in controller");
      return new Response(JSON.stringify({
        error: "Database client is not available",
        documents: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // ADDITIONAL DEBUGGING: Try a simple database query to confirm connection
    try {
      console.log("Testing database connection with a simple query");
      const testResult = await client.queryObject("SELECT 1 as test");
      console.log("Database connection test result:", testResult.rows);
    } catch (testError) {
      console.error("Database connection test failed:", testError);
      return new Response(JSON.stringify({
        error: "Database connection failed",
        message: testError.message,
        documents: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Convert sort parameter to appropriate order
    let sortField = 'id';
    let order = 'ASC';
    
    if (sort === 'latest') {
      sortField = 'publication_date';
      order = 'DESC';
    } else if (sort === 'earliest') {
      sortField = 'publication_date';
      order = 'ASC';
    }
    
    // Use document service to fetch actual documents with the new interface
    console.log("Calling documentService.fetchDocuments() with options");
    const result = await fetchDocumentsService({
      page,
      limit: size,
      category,
      search,
      sort: sortField,
      order
    });
    
    console.log(`Documents fetched: ${result.documents.length} documents found`);
    
    // Check if we received fewer documents than expected
    if (result.documents.length === 0 && result.totalCount > 0) {
      console.warn("No documents returned despite totalCount > 0. This might indicate a database issue.");
    }
    
    // Add structured debug info to the response for troubleshooting
    const responseWithDebug = {
      ...result,
      _debug: {
        requestParams: {
          page, size, category, sort
        },
        timestamp: new Date().toISOString(),
        source: "documentController.ts"
      }
    };
    
    // Create and return response
    return new Response(JSON.stringify(responseWithDebug), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in document controller:", error);
    
    // Return error response
    return new Response(JSON.stringify({
      error: true,
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

/**
 * Get a specific document by ID
 */
export async function getDocumentById(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const document = await DocumentModel.getById(parseInt(documentId));
    
    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify(document), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Create a new document
 */
export async function createDocument(req: Request): Promise<Response> {
  try {
    if (req.body) {
      const body = await req.json();
      
      // Validate required fields
      if (!body.title) {
        return new Response(JSON.stringify({ error: "Title is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Validate document_type against known types
      const validDocumentTypes = ['THESIS', 'DISSERTATION', 'CONFLUENCE', 'SYNERGY', 'RESEARCH_STUDY'];
      if (body.document_type && !validDocumentTypes.includes(body.document_type)) {
        return new Response(JSON.stringify({ 
          error: `Invalid document_type. Must be one of: ${validDocumentTypes.join(', ')}` 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Set appropriate file paths based on document type if not already set
      if (!body.file_path && body.document_type) {
        switch (body.document_type) {
          case 'THESIS':
            body.file_path = 'storage/single/thesis/';
            break;
          case 'DISSERTATION':
            body.file_path = 'storage/single/dissertation/';
            break;
          case 'CONFLUENCE':
            body.file_path = 'storage/compiled/confluence/';
            break;
          case 'SYNERGY':
            body.file_path = 'storage/compiled/synergy/';
            break;
          case 'RESEARCH_STUDY':
            // If it's part of a compiled document, file path will be set elsewhere
            if (body.parent_document_id) {
              // We'll leave it as is since the parent document path is needed first
            } else {
              body.file_path = 'storage/research_studies/';
            }
            break;
        }
      }
      
      // For single documents (THESIS or DISSERTATION), we don't include volume and issue
      if (body.document_type === 'THESIS' || body.document_type === 'DISSERTATION') {
        // Remove volume and issue if they exist
        delete body.volume;
        delete body.issue;
      }

      // For Synergy documents, ensure issue is null and department_id is used
      if (body.document_type === 'SYNERGY') {
        // Always set issue to null for Synergy documents
        body.issue = null;
        
        // Make sure department_id is present
        if (!body.department_id) {
          console.warn('SYNERGY document created without department_id');
        }
      }

      // For research studies in compiled documents, set appropriate category_id if not already set
      if (body.document_type === 'RESEARCH_STUDY' && body.parent_document_id && !body.category_id) {
        body.category_id = 5; // Default research study category ID
      }
      
      console.log('Creating document with data:', JSON.stringify(body, null, 2));
      const newDocument = await DocumentModel.create(body);
      
      return new Response(JSON.stringify(newDocument), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error creating document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (req.body) {
      const body = await req.json();
      
      // Check if document exists
      const existingDocument = await DocumentModel.getById(parseInt(documentId));
      
      if (!existingDocument) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const updatedDocument = await DocumentModel.update(parseInt(documentId), body);
      
      return new Response(JSON.stringify(updatedDocument), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error updating document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Delete a document (soft delete)
 */
export async function deleteDocument(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Check if document exists
    const existingDocument = await DocumentModel.getById(parseInt(documentId));
    
    if (!existingDocument) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    await DocumentModel.delete(parseInt(documentId));
    
    return new Response(JSON.stringify({ message: "Document deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Get child documents for a compiled document
 * @param req - The request object
 * @returns Response with child documents
 */
export async function getChildDocuments(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const matches = path.match(/\/api\/documents\/(\d+)\/children/);
    
    if (!matches || !matches[1]) {
      return new Response(JSON.stringify({ error: "Invalid document ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const documentId = parseInt(matches[1]);
    console.log(`Controller: Fetching child documents for parent ID: ${documentId}`);
    
    const result = await fetchChildDocumentsService(documentId);
    
    // Create a safe version of the documents to avoid serialization issues
    const safeDocuments = [];
    
    for (const doc of result.documents) {
      // Create a basic safe document object
      const safeDoc: Record<string, any> = {
        id: doc.id,
        title: typeof doc.title === 'string' ? doc.title : '',
        description: typeof doc.description === 'string' ? doc.description : '',
        document_type: typeof doc.document_type === 'string' ? doc.document_type : '',
        volume: typeof doc.volume === 'string' ? doc.volume : '',
        issue: typeof doc.issue === 'string' ? doc.issue : '',
        is_compiled: Boolean(doc.is_compiled),
        parent_compiled_id: doc.parent_compiled_id
      };
      
      // Handle date carefully
      if (doc.publication_date instanceof Date) {
        safeDoc.publication_date = doc.publication_date.toISOString();
      } else {
        safeDoc.publication_date = null;
      }
      
      // Handle authors array
      safeDoc.authors = [];
      if (Array.isArray(doc.authors)) {
        for (const author of doc.authors) {
          if (author && typeof author === 'object') {
            safeDoc.authors.push({
              id: author.id,
              full_name: typeof author.full_name === 'string' ? author.full_name : ''
            });
          }
        }
      }
      
      // Handle topics array
      safeDoc.topics = [];
      if (Array.isArray(doc.topics)) {
        for (const topic of doc.topics) {
          if (topic && typeof topic === 'object') {
            safeDoc.topics.push({
              id: topic.id,
              name: typeof topic.name === 'string' ? topic.name : ''
            });
          }
        }
      }
      
      safeDocuments.push(safeDoc);
    }
    
    // Create the final response object
    const responseObject = {
      documents: safeDocuments
    };
    
    return new Response(JSON.stringify(responseObject), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(`Error fetching child documents:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: "Error fetching child documents",
      message: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
