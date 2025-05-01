import { createCompiledDocument as createCompiledDocumentService, getCompiledDocument as getCompiledDocumentService, addDocumentToCompilation as addDocumentToCompilationService, removeDocumentFromCompilation as removeDocumentFromCompilationService } from "../services/documentService.ts";

/**
 * Creates a new compiled document
 * @param compiledDoc The compiled document data
 * @param documentIds Array of document IDs to associate with the compiled document
 * @returns The created compiled document ID
 */
export async function createCompiledDocument(
  compiledDoc: {
    start_year?: number;
    end_year?: number;
    volume?: number;
    issue_number?: number;
    department?: string;
    category?: string;
  },
  documentIds: number[]
): Promise<number> {
  return await createCompiledDocumentService(compiledDoc, documentIds);
}

/**
 * Fetches a compiled document by ID
 * @param compiledDocId The compiled document ID
 * @returns The compiled document data
 */
export async function getCompiledDocument(compiledDocId: number): Promise<any> {
  return await getCompiledDocumentService(compiledDocId);
}

/**
 * Adds a document to a compilation
 * @param compiledDocId The compiled document ID
 * @param documentId The document ID to add
 */
export async function addDocumentToCompilation(compiledDocId: number, documentId: number): Promise<void> {
  await addDocumentToCompilationService(compiledDocId, documentId);
}

/**
 * Removes a document from a compilation
 * @param compiledDocId The compiled document ID
 * @param documentId The document ID to remove
 */
export async function removeDocumentFromCompilation(compiledDocId: number, documentId: number): Promise<void> {
  await removeDocumentFromCompilationService(compiledDocId, documentId);
}

/**
 * HTTP handler for creating a compiled document
 * @param request The HTTP request
 * @returns The HTTP response
 */
export async function handleCreateCompiledDocument(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    
    if (!body.compiledDoc || typeof body.compiledDoc !== 'object') {
      return new Response(JSON.stringify({ error: 'compiledDoc is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default to empty array if documentIds not provided
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds : [];

    const compiledDocId = await createCompiledDocument(body.compiledDoc, documentIds);

    return new Response(JSON.stringify({ id: compiledDocId, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('Error creating compiled document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create compiled document';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * HTTP handler for getting a compiled document by ID
 * @param request The HTTP request
 * @returns The HTTP response
 */
export async function handleGetCompiledDocument(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = parseInt(pathParts[pathParts.length - 1], 10);

  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const compiledDoc = await getCompiledDocument(id);
    
    if (!compiledDoc) {
      return new Response(JSON.stringify({ error: 'Compiled document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(compiledDoc), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error(`Error fetching compiled document with ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compiled document';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * HTTP handler for adding documents to a compilation
 * @param request The HTTP request
 * @returns The HTTP response
 */
export async function handleAddDocumentsToCompilation(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    
    if (!body.compiledDocumentId || isNaN(parseInt(body.compiledDocumentId, 10))) {
      return new Response(JSON.stringify({ error: 'Valid compiledDocumentId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!Array.isArray(body.documentIds) || body.documentIds.length === 0) {
      return new Response(JSON.stringify({ error: 'documentIds array is required and cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const compiledDocumentId = parseInt(body.compiledDocumentId, 10);
    const results = [];

    // Process each document ID and track results
    for (const docId of body.documentIds) {
      try {
        await addDocumentToCompilation(compiledDocumentId, docId);
        results.push({ documentId: docId, success: true });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : `Failed to add document ${docId}`;
        console.error(`Failed to add document ${docId} to compilation ${compiledDocumentId}:`, error);
        results.push({ documentId: docId, success: false, error: errorMessage });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('Error adding documents to compilation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add documents to compilation';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 