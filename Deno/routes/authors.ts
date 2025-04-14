import { client } from "../data/denopost_conn.ts";
import { Context, RouterContext } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { State } from "https://deno.land/x/oak@v17.1.4/application.ts";
import { helpers } from "https://deno.land/x/oak@v17.1.4/mod.ts";

type AuthorContext = RouterContext<string, Record<string, string>, State>;
type AuthorData = {
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
};

/**
 * Get all authors with their document counts
 */
export async function getAllAuthors(searchQuery?: string) {
  try {
    const query = `
      SELECT 
        a.author_id,
        a.full_name,
        a.department,
        a.email,
        a.affiliation,
        a.year_of_graduation,
        a.linkedin,
        a.biography as bio,
        a.orcid_id,
        a.profile_picture,
        COUNT(d.id) as document_count
      FROM 
        authors a
      LEFT JOIN 
        document_authors da ON a.author_id = da.author_id
      LEFT JOIN 
        documents d ON da.document_id = d.id
      ${searchQuery ? `WHERE LOWER(a.full_name) LIKE LOWER($1)` : ''}
      GROUP BY 
        a.author_id, a.full_name, a.department, a.email, a.affiliation, a.year_of_graduation,
        a.linkedin, a.biography, a.orcid_id, a.profile_picture
      ORDER BY 
        a.full_name
    `;

    const result = await client.queryObject(
      query,
      searchQuery ? [`%${searchQuery}%`] : []
    );

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
        a.full_name, 
        a.department, 
        a.email,
        a.affiliation,
        a.year_of_graduation,
        a.linkedin,
        a.biography as bio,
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
        a.author_id, a.full_name, a.department, a.email, a.affiliation, a.year_of_graduation,
        a.linkedin, a.biography, a.orcid_id, a.profile_picture
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

interface Author {
  author_id: string;
  full_name: string;
  department: string | null;
  email: string | null;
  affiliation: string | null;
  year_of_graduation: number | null;
  linkedin: string | null;
  biography: string | null;
  orcid_id: string | null;
  profile_picture: string | null;
  document_count: bigint;
}

/**
 * Handle GET request for authors
 */
export async function handleGetAuthors(ctx: AuthorContext) {
  try {
    const authors = await getAllAuthors();
    ctx.response.status = 200;
    ctx.response.body = authors;
  } catch (error) {
    console.error("Error fetching authors:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch authors" };
  }
}

/**
 * Handle GET request for a single author
 */
export async function handleGetAuthorById(ctx: AuthorContext) {
  try {
    const id = parseInt(ctx.params.id);
    const author = await getAuthorById(id.toString());
    if (!author) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Author not found" };
      return;
    }
    ctx.response.status = 200;
    ctx.response.body = author;
  } catch (error) {
    console.error("Error fetching author:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch author" };
  }
}

/**
 * Handle GET request for documents by author
 */
export async function handleGetDocumentsByAuthor(ctx: AuthorContext) {
  try {
    const id = parseInt(ctx.params.id);
    const documents = await getDocumentsByAuthor(id);
    ctx.response.status = 200;
    ctx.response.body = documents;
  } catch (error) {
    console.error("Error fetching author documents:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch author documents" };
  }
}

/**
 * Create a new author
 */
export async function createAuthor(authorData: {
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
}) {
  try {
    const result = await client.queryObject(`
      INSERT INTO authors (
        full_name, department, email, affiliation, year_of_graduation,
        linkedin, biography, orcid_id, profile_picture
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `, [
      authorData.full_name,
      authorData.department,
      authorData.email,
      authorData.affiliation,
      authorData.year_of_graduation,
      authorData.linkedin,
      authorData.biography,
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
  biography?: string;
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
 * Delete an author
 */
export async function deleteAuthor(id: string) {
  try {
    // Delete the author directly
    const result = await client.queryObject(`
      DELETE FROM authors WHERE author_id = $1 RETURNING author_id
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error("Author not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error deleting author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Handle POST request to create a new author
 */
export async function handleCreateAuthor(ctx: AuthorContext) {
  try {
    const result = ctx.request.body({ type: "json" });
    const authorData = (await result.value) as AuthorData;
    const author = await createAuthor(authorData);
    ctx.response.status = 201;
    ctx.response.body = author;
  } catch (error) {
    console.error("Error creating author:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to create author" };
  }
}

/**
 * Handle PUT request to update an author
 */
export async function handleUpdateAuthor(ctx: AuthorContext) {
  try {
    const id = ctx.params.id;
    const result = ctx.request.body({ type: "json" });
    const authorData = (await result.value) as AuthorData;
    const author = await updateAuthor(id, authorData);
    if (!author) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Author not found" };
      return;
    }
    ctx.response.status = 200;
    ctx.response.body = author;
  } catch (error) {
    console.error("Error updating author:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update author" };
  }
}

/**
 * Handle DELETE request to delete an author
 */
export async function handleDeleteAuthor(ctx: AuthorContext) {
  try {
    const id = ctx.params.id;
    await deleteAuthor(id);
    ctx.response.status = 200;
    ctx.response.body = {};
  } catch (error) {
    console.error("Error deleting author:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to delete author" };
  }
} 