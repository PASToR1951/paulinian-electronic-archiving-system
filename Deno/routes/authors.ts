import { client } from "../data/denopost_conn.ts";

/**
 * Get all authors with their document counts
 */
export async function getAllAuthors(includeDeleted = false) {
  try {
    const result = await client.queryObject(`
      SELECT 
        a.author_id, 
        a.full_name as name, 
        a.department, 
        a.email,
        a.affiliation,
        a.year_of_graduation,
        a.linkedin,
        a.biography as bio,
        a.orcid_id,
        a.profile_picture,
        a.deleted_at,
        COUNT(d.id) as document_count
      FROM 
        authors a
      LEFT JOIN 
        document_authors da ON a.author_id = da.author_id
      LEFT JOIN 
        documents d ON da.document_id = d.id
      ${!includeDeleted ? 'WHERE a.deleted_at IS NULL' : ''}
      GROUP BY 
        a.author_id, a.full_name, a.department, a.email, a.affiliation, a.year_of_graduation, 
        a.linkedin, a.biography, a.orcid_id, a.profile_picture, a.deleted_at
      ORDER BY 
        a.full_name
    `);

    return result.rows;
  } catch (error) {
    console.error("Error fetching authors:", error);
    throw error;
  }
}

/**
 * Get a single author by ID
 */
export async function getAuthorById(id: string) {
  try {
    const result = await client.queryObject(`
      SELECT 
        a.author_id, 
        a.name, 
        a.department, 
        a.email,
        a.affiliation,
        a.year_of_graduation,
        a.linkedin,
        a.bio,
        a.orcid_id,
        a.profile_picture,
        COUNT(d.id) as document_count
      FROM 
        authors a
      LEFT JOIN 
        document_authors da ON a.author_id = da.author_id
      LEFT JOIN 
        documents d ON da.document_id = d.id
      WHERE 
        a.author_id = $1
      GROUP BY 
        a.author_id, a.name, a.department, a.email, a.affiliation, a.year_of_graduation,
        a.linkedin, a.bio, a.orcid_id, a.profile_picture
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get documents by author ID
 */
export async function getDocumentsByAuthor(authorId: number) {
  try {
    const result = await client.queryObject(`
      SELECT 
        d.id, 
        d.title, 
        d.publication_date, 
        d.file,
        d.volume,
        d.abstract,
        c.category_name
      FROM 
        documents d
      JOIN 
        document_authors da ON d.id = da.document_id
      LEFT JOIN 
        categories c ON d.category_id = c.id
      WHERE 
        da.author_id = $1
      ORDER BY 
        d.publication_date DESC
    `, [authorId]);

    return result.rows;
  } catch (error) {
    console.error(`Error fetching documents for author ${authorId}:`, error);
    throw error;
  }
}

/**
 * Handle GET request for all authors
 */
export async function handleGetAuthors(request: Request) {
  console.log("Handling GET request for all authors");
  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    
    console.log("Fetching authors from database...");
    const authors = await getAllAuthors(includeDeleted);
    console.log(`Successfully fetched ${authors.length} authors`);
    return new Response(JSON.stringify(authors), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });
  } catch (error: unknown) {
    console.error("Error in handleGetAuthors:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: "Failed to fetch authors",
      details: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Handle GET request for a single author
 */
export async function handleGetAuthorById(id: number) {
  try {
    const author = await getAuthorById(id.toString());
    
    if (!author) {
      return new Response(JSON.stringify({ error: "Author not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify(author), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error in handleGetAuthorById for ID ${id}:`, error);
    return new Response(JSON.stringify({ error: "Failed to fetch author" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Handle GET request for documents by author
 */
export async function handleGetDocumentsByAuthor(authorId: number) {
  try {
    const documents = await getDocumentsByAuthor(authorId);
    return new Response(JSON.stringify(documents), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error in handleGetDocumentsByAuthor for ID ${authorId}:`, error);
    return new Response(JSON.stringify({ error: "Failed to fetch documents" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Create a new author
 */
export async function createAuthor(authorData: {
  name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number;
  linkedin?: string;
  bio?: string;
  orcid_id?: string;
  profile_picture?: string;
}) {
  try {
    const result = await client.queryObject(`
      INSERT INTO authors (
        name, department, email, affiliation, year_of_graduation,
        linkedin, bio, orcid_id, profile_picture
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `, [
      authorData.name,
      authorData.department,
      authorData.email,
      authorData.affiliation,
      authorData.year_of_graduation,
      authorData.linkedin,
      authorData.bio,
      authorData.orcid_id,
      authorData.profile_picture
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("Error creating author:", error);
    throw error;
  }
}

/**
 * Update an existing author
 */
export async function updateAuthor(id: string, authorData: {
  full_name?: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number;
  linkedin?: string;
  bio?: string;
  orcid_id?: string;
  profile_picture?: string;
}) {
  try {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    Object.entries(authorData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id); // Add ID as the last parameter

    const result = await client.queryObject(`
      UPDATE authors 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE author_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error("Author not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error updating author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an author (soft delete)
 */
export async function deleteAuthor(id: string) {
  try {
    console.log(`Attempting to soft delete author with ID: ${id}`);
    
    // Instead of deleting, set the deleted_at timestamp
    const result = await client.queryObject(`
      UPDATE authors 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE author_id = $1 AND deleted_at IS NULL 
      RETURNING author_id, deleted_at
    `, [id]);

    console.log(`Delete query result:`, result);

    if (result.rows.length === 0) {
      console.log(`No author found with ID ${id} or author is already deleted`);
      throw new Error("Author not found or already deleted");
    }

    console.log(`Successfully soft deleted author with ID ${id}`);
    return result.rows[0];
  } catch (error) {
    console.error(`Error soft deleting author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Permanently delete an author (hard delete)
 */
export async function hardDeleteAuthor(id: string) {
  try {
    const result = await client.queryObject(`
      DELETE FROM authors 
      WHERE author_id = $1 AND deleted_at IS NOT NULL 
      RETURNING author_id
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error("Author not found or not in trash");
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error permanently deleting author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Restore a deleted author
 */
export async function restoreAuthor(id: string) {
  try {
    const result = await client.queryObject(`
      UPDATE authors 
      SET deleted_at = NULL 
      WHERE author_id = $1 AND deleted_at IS NOT NULL 
      RETURNING author_id
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error("Author not found in trash");
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error restoring author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Handle POST request to create a new author
 */
export async function handleCreateAuthor(req: Request) {
  try {
    const authorData = await req.json();
    const newAuthor = await createAuthor(authorData);
    return new Response(JSON.stringify(newAuthor), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleCreateAuthor:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: "Failed to create author",
      details: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Handle PUT request to update an author
 */
export async function handleUpdateAuthor(id: string, req: Request) {
  try {
    const authorData = await req.json();
    const updatedAuthor = await updateAuthor(id, authorData);
    return new Response(JSON.stringify(updatedAuthor), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error in handleUpdateAuthor for ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: "Failed to update author",
      details: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Handle DELETE request to delete an author
 */
export async function handleDeleteAuthor(id: string) {
  try {
    // Check if the author exists and is already deleted
    const checkResult = await client.queryObject(`
      SELECT author_id, deleted_at 
      FROM authors 
      WHERE author_id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      // Author doesn't exist at all
      console.log(`Author with ID ${id} doesn't exist in the database`);
      return new Response(JSON.stringify({ 
        error: "Author not found",
        details: "No author exists with this ID" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const author = checkResult.rows[0];
    if (author.deleted_at) {
      // Author already deleted, return success with appropriate message
      console.log(`Author with ID ${id} is already deleted, returning success`);
      return new Response(JSON.stringify({ 
        message: "Author was already deleted",
        author_id: id,
        deleted_at: author.deleted_at
      }), {
        status: 200, // Return 200 as the desired end state is achieved
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Proceed with deletion if author exists and is not deleted
    await deleteAuthor(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error in handleDeleteAuthor for ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: "Failed to delete author",
      details: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Handle POST request to restore an author
 */
export async function handleRestoreAuthor(id: string) {
  try {
    await restoreAuthor(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error in handleRestoreAuthor for ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: "Failed to restore author",
      details: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 