import { DocumentModel } from "../models/documentModel.ts";
import type { Response, Request } from "../deps.ts";

/**
 * Fetch documents based on query parameters
 */
export async function fetchDocuments(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Extract query parameters
    const categoryId = searchParams.get("categoryId");
    const authorId = searchParams.get("authorId");
    const searchTerm = searchParams.get("search");
    const publicOnly = searchParams.get("publicOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    // Get documents from database based on filters
    const documents = await DocumentModel.getFiltered({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      authorId: authorId ? parseInt(authorId) : undefined,
      searchTerm,
      publicOnly,
      page,
      limit
    });

    return new Response(JSON.stringify(documents), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
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
      
      // For single documents (THESIS or DISSERTATION), we don't include volume and issue
      if (body.document_type === 'THESIS' || body.document_type === 'DISSERTATION') {
        // Remove volume and issue if they exist
        delete body.volume;
        delete body.issue;
      }
      
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
