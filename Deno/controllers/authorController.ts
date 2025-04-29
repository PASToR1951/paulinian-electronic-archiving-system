import { Context } from "../deps.ts";
import { client } from "../db/denopost_conn.ts";

interface Author {
  id: string;
  spud_id?: string;
  full_name: string;
  affiliation?: string;
  department?: string;
  email?: string;
  orcid_id?: string;
  biography?: string;
  profile_picture?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Create a new author
 */
export const createAuthor = async (ctx: Context) => {
  try {
    // Parse the request body
    const body = ctx.request.body();
    
    if (body.type !== "json") {
      ctx.response.status = 400;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Request body must be JSON" };
      return;
    }
    
    const authorData = await body.value;
    
    // Validate required fields
    if (!authorData.full_name) {
      ctx.response.status = 400;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Author full name is required" };
      return;
    }
    
    // Check if author already exists with the same name
    const existingAuthor = await client.queryObject(
      `SELECT * FROM authors WHERE full_name ILIKE $1`,
      [authorData.full_name]
    );
    
    if (existingAuthor.rows.length > 0) {
      ctx.response.status = 409; // Conflict
      ctx.response.type = "application/json";
      ctx.response.body = { 
        error: "Author with this name already exists",
        existing: existingAuthor.rows[0]
      };
      return;
    }
    
    // Create the new author
    const result = await client.queryObject(
      `INSERT INTO authors (
        spud_id, full_name, affiliation, department, 
        email, orcid_id, biography, profile_picture
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        authorData.spud_id || null,
        authorData.full_name,
        authorData.affiliation || null,
        authorData.department || null,
        authorData.email || null,
        authorData.orcid_id || null,
        authorData.biography || null,
        authorData.profile_picture || null
      ]
    );
    
    if (result.rows.length === 0) {
      throw new Error("Failed to create author");
    }
    
    console.log(`Created new author: ${authorData.full_name}`);
    
    ctx.response.status = 201; // Created
    ctx.response.type = "application/json";
    ctx.response.body = {
      message: "Author created successfully",
      author: result.rows[0]
    };
  } catch (error) {
    console.error("Error creating author:", error);
    ctx.response.status = 500;
    ctx.response.type = "application/json";
    ctx.response.body = { 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

/**
 * Create multiple authors in batch
 */
export const createAuthors = async (ctx: Context) => {
  try {
    // Parse the request body
    const body = ctx.request.body();
    
    if (body.type !== "json") {
      ctx.response.status = 400;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Request body must be JSON" };
      return;
    }
    
    const authorsData = await body.value;
    
    // Check if input is an array
    if (!Array.isArray(authorsData)) {
      ctx.response.status = 400;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Request body must be an array of authors" };
      return;
    }
    
    // Validate each author has at least a full_name
    for (const author of authorsData) {
      if (!author.full_name) {
        ctx.response.status = 400;
        ctx.response.type = "application/json";
        ctx.response.body = { error: "All authors must have a full_name" };
        return;
      }
    }
    
    // Process each author
    const results = [];
    const errors = [];
    
    for (const authorData of authorsData) {
      try {
        // Check if author already exists
        const existingAuthor = await client.queryObject(
          `SELECT * FROM authors WHERE full_name ILIKE $1`,
          [authorData.full_name]
        );
        
        if (existingAuthor.rows.length > 0) {
          errors.push({
            full_name: authorData.full_name,
            error: "Author with this name already exists",
            existing: existingAuthor.rows[0]
          });
          continue;
        }
        
        // Create the new author
        const result = await client.queryObject(
          `INSERT INTO authors (
            spud_id, full_name, affiliation, department, 
            email, orcid_id, biography, profile_picture
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            authorData.spud_id || null,
            authorData.full_name,
            authorData.affiliation || null,
            authorData.department || null,
            authorData.email || null,
            authorData.orcid_id || null,
            authorData.biography || null,
            authorData.profile_picture || null
          ]
        );
        
        if (result.rows.length === 0) {
          errors.push({
            full_name: authorData.full_name,
            error: "Failed to create author"
          });
        } else {
          console.log(`Created new author: ${authorData.full_name}`);
          results.push(result.rows[0]);
        }
      } catch (error) {
        console.error(`Error creating author ${authorData.full_name}:`, error);
        errors.push({
          full_name: authorData.full_name,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    ctx.response.status = 201; // Created
    ctx.response.type = "application/json";
    ctx.response.body = {
      message: `Created ${results.length} authors with ${errors.length} errors`,
      authors: results,
      errors: errors
    };
  } catch (error) {
    console.error("Error in batch author creation:", error);
    ctx.response.status = 500;
    ctx.response.type = "application/json";
    ctx.response.body = { 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

/**
 * Handle author search directly
 */
export const searchAuthors = async (ctx: Context) => {
  console.log("Author search handler hit:", ctx.request.url.href);
  const searchParam = ctx.request.url.searchParams.get("q") || "";
  
  try {
    if (searchParam.length < 2) {
      ctx.response.status = 200;
      ctx.response.type = "application/json";
      ctx.response.body = [];
      return;
    }
    
    // Directly execute the database query
    const result = await client.queryObject(
      `SELECT * FROM authors 
       WHERE full_name ILIKE $1
       ORDER BY full_name ASC 
       LIMIT 10`,
      [`%${searchParam}%`]
    );
    
    console.log(`Found ${result.rows.length} authors matching "${searchParam}"`);
    
    ctx.response.status = 200;
    ctx.response.type = "application/json";
    ctx.response.body = result.rows;
  } catch (error) {
    console.error("Error searching authors:", error);
    ctx.response.status = 500;
    ctx.response.type = "application/json";
    ctx.response.body = { 
      error: error instanceof Error ? error.message : "Unknown error",
      searchParam
    };
  }
};

/**
 * Handle author test endpoint
 */
export const testAuthorApi = async (ctx: Context) => {
  console.log("Author API test endpoint hit");
  ctx.response.status = 200;
  ctx.response.type = "application/json";
  ctx.response.body = {
    message: "Author API test endpoint is working",
    timestamp: new Date().toISOString()
  };
};

/**
 * Delete an author
 */
export const deleteAuthor = async (ctx: Context) => {
  try {
    // Access the ID from the URL path components
    const pathname = ctx.request.url.pathname;
    const parts = pathname.split('/');
    const id = parts[parts.length - 1];
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Author ID is required" };
      return;
    }

    // Directly use the database client
    const result = await client.queryArray(
      "DELETE FROM authors WHERE id = $1",
      [id]
    );
    
    const rowCount = result.rowCount || 0;
    if (rowCount > 0) {
      ctx.response.status = 200;
      ctx.response.type = "application/json";
      ctx.response.body = { message: "Author deleted successfully" };
    } else {
      ctx.response.status = 404;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Author not found or could not be deleted" };
    }
  } catch (error) {
    console.error("Error deleting author:", error);
    ctx.response.status = 500;
    ctx.response.type = "application/json";
    ctx.response.body = { 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

/**
 * Restore a deleted author (placeholder)
 */
export const restoreAuthor = async (ctx: Context) => {
  try {
    // Access the ID from the URL path components
    const pathname = ctx.request.url.pathname;
    const parts = pathname.split('/');
    const id = parts[parts.length - 2]; // ID is second-to-last part in /authors/:id/restore
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Author ID is required" };
      return;
    }

    // Placeholder response - would need to implement soft delete functionality
    ctx.response.status = 501; // Not Implemented
    ctx.response.type = "application/json";
    ctx.response.body = { error: "Restore functionality not implemented" };
  } catch (error) {
    console.error("Error restoring author:", error);
    ctx.response.status = 500;
    ctx.response.type = "application/json";
    ctx.response.body = { 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}; 