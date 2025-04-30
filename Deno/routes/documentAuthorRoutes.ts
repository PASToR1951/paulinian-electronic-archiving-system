// Routes for document-author relationships

import { Router } from "../deps.ts";
import { createDocumentAuthors, getDocumentAuthors } from "../controllers/documentAuthorController.ts";

const router = new Router();

// Route to add authors to a document
router.post("/document-authors", async (ctx) => {
  try {
    // Get request body
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Validate request body
    if (!body.document_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "document_id is required" };
      return;
    }
    
    if (!body.authors || !Array.isArray(body.authors) || body.authors.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "authors array is required and must not be empty" };
      return;
    }
    
    // Create document-author relationships
    const documentAuthors = await createDocumentAuthors(body.document_id, body.authors);
    
    // Return success response
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      document_id: body.document_id,
      authors_count: documentAuthors.length,
      authors: documentAuthors
    };
  } catch (error) {
    console.error("Error in document-authors endpoint:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to create document-author relationships",
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Route to get authors for a document
router.get("/document-authors/:documentId", async (ctx) => {
  try {
    const documentId = ctx.params.documentId;
    
    if (!documentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "document_id is required" };
      return;
    }
    
    // Get authors for the document
    const authors = await getDocumentAuthors(documentId);
    
    // Return success response
    ctx.response.status = 200;
    ctx.response.body = {
      document_id: documentId,
      authors_count: authors.length,
      authors: authors
    };
  } catch (error) {
    console.error("Error in get document-authors endpoint:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to get document authors",
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

export default router; 