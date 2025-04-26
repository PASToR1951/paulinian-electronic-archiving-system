/**
 * Author Controller - Handles HTTP request/response for author-related endpoints
 */

import { client } from "../data/denopost_conn.ts";
import { createErrorResponse } from "../utils/errors.ts";
import {
  getAllAuthors,
  getAuthorById,
  getDocumentsByAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  restoreAuthor,
  mapAuthorToResponse
} from "../services/author-service.ts";

// Define the Author interface
interface Author {
  author_id: string;
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
  document_count?: bigint;
  deleted_at?: string | null;
}

// Enhanced Request interface with additional methods that Deno's Request provides
interface EnhancedRequest extends Request {
  json(): Promise<any>;
}

/**
 * Search for authors
 */
export async function searchAuthors(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const includeDeleted = url.searchParams.get("includeDeleted") === "true";

    console.log("Searching for authors with query:", query);

    // Get authors from service layer
    const authors = await getAllAuthors(includeDeleted, query);
    
    // Map to API response format
    const mappedAuthors = authors.map(author => mapAuthorToResponse(author));

    return new Response(JSON.stringify(mappedAuthors), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in searchAuthors:", error);
    return createErrorResponse(error);
  }
}

/**
 * Get author by ID
 */
export async function fetchAuthorById(id: string): Promise<Response> {
  try {
    const author = await getAuthorById(id);
    return new Response(JSON.stringify(mapAuthorToResponse(author)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error fetching author with ID ${id}:`, error);
    return createErrorResponse(error);
  }
}

/**
 * Get documents by author ID
 */
export async function fetchDocumentsByAuthor(authorId: string): Promise<Response> {
  try {
    const documents = await getDocumentsByAuthor(authorId);
    return new Response(JSON.stringify(documents), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error fetching documents for author ${authorId}:`, error);
    return createErrorResponse(error);
  }
}

/**
 * Create a new author
 */
export async function handleCreateAuthor(req: Request): Promise<Response> {
  try {
    // Cast to the EnhancedRequest to use the json method
    const data = await (req as EnhancedRequest).json();
    const newAuthor = await createAuthor(data);
    
    return new Response(JSON.stringify(mapAuthorToResponse(newAuthor)), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating author:", error);
    return createErrorResponse(error);
  }
}

/**
 * Update an existing author
 */
export async function handleUpdateAuthor(id: string, req: Request): Promise<Response> {
  try {
    // Cast to the EnhancedRequest to use the json method
    const data = await (req as EnhancedRequest).json();
    const updatedAuthor = await updateAuthor(id, data);
    
    return new Response(JSON.stringify(mapAuthorToResponse(updatedAuthor)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error updating author with ID ${id}:`, error);
    return createErrorResponse(error);
  }
}

/**
 * Delete an author (soft delete)
 */
export async function handleDeleteAuthor(id: string): Promise<Response> {
  try {
    const result = await deleteAuthor(id);
    
    if (result.already_deleted) {
      return new Response(JSON.stringify({
        message: "Author was already deleted",
        author_id: id,
        deleted_at: result.deleted_at
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Return 204 No Content on successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting author with ID ${id}:`, error);
    return createErrorResponse(error);
  }
}

/**
 * Restore a deleted author
 */
export async function handleRestoreAuthor(id: string): Promise<Response> {
  try {
    const restoredAuthor = await restoreAuthor(id);
    
    return new Response(JSON.stringify(mapAuthorToResponse(restoredAuthor)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error restoring author with ID ${id}:`, error);
    return createErrorResponse(error);
  }
}
