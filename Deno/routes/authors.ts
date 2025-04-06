import { client } from "../data/denopost_conn.ts";

/**
 * Get all authors with their document counts
 */
export async function getAllAuthors() {
  try {
    const result = await client.queryObject(`
      SELECT 
        a.id, 
        a.name, 
        a.department, 
        a.email,
        COUNT(d.id) as document_count
      FROM 
        authors a
      LEFT JOIN 
        document_authors da ON a.id = da.author_id
      LEFT JOIN 
        documents d ON da.document_id = d.id
      GROUP BY 
        a.id, a.name, a.department, a.email
      ORDER BY 
        a.name
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
export async function getAuthorById(id: number) {
  try {
    const result = await client.queryObject(`
      SELECT 
        a.id, 
        a.name, 
        a.department, 
        a.email,
        COUNT(d.id) as document_count
      FROM 
        authors a
      LEFT JOIN 
        document_authors da ON a.id = da.author_id
      LEFT JOIN 
        documents d ON da.document_id = d.id
      WHERE 
        a.id = $1
      GROUP BY 
        a.id, a.name, a.department, a.email
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
export async function handleGetAuthors() {
  console.log("Handling GET request for all authors");
  try {
    console.log("Fetching authors from database...");
    const authors = await getAllAuthors();
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
    const author = await getAuthorById(id);
    
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