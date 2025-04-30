// Document-Author controller for managing document-author relationships

import { client } from "../db/denopost_conn.ts";

// Define author interface
interface Author {
  id: string;
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
 * Get or create an author by name
 * @param fullName The author's full name
 * @returns The author object with ID
 */
async function getOrCreateAuthor(fullName: string): Promise<Author> {
  // First try to find the author by name
  const findQuery = `
    SELECT * FROM authors 
    WHERE full_name = $1 
    LIMIT 1
  `;
  
  const findResult = await client.queryObject(findQuery, [fullName]);
  
  if (findResult.rows.length > 0) {
    const author = findResult.rows[0] as unknown as Author;
    console.log(`Found existing author: ${fullName} with ID: ${author.id}`);
    return author;
  }
  
  // Author doesn't exist, create a new one
  const createQuery = `
    INSERT INTO authors (
      full_name, 
      created_at, 
      updated_at
    ) VALUES (
      $1, NOW(), NOW()
    ) RETURNING *
  `;
  
  const createResult = await client.queryObject(createQuery, [fullName]);
  
  if (createResult.rows.length === 0) {
    throw new Error(`Failed to create author: ${fullName}`);
  }
  
  const newAuthor = createResult.rows[0] as unknown as Author;
  console.log(`Created new author: ${fullName} with ID: ${newAuthor.id}`);
  return newAuthor;
}

// Define document-author relationship interface
interface DocumentAuthor {
  document_id: string;
  author_id: string;
  author_order: number;
}

/**
 * Create document-author relationships
 * @param documentId The document ID
 * @param authors Array of author names
 * @returns The created document-author relationship entries
 */
export async function createDocumentAuthors(documentId: string, authors: string[]): Promise<DocumentAuthor[]> {
  try {
    console.log(`Creating document-author relationships for document ID: ${documentId} with authors:`, authors);
    
    if (!documentId) {
      throw new Error("Document ID is required");
    }
    
    if (!authors || authors.length === 0) {
      throw new Error("At least one author is required");
    }
    
    // First, clear any existing relationships for this document
    const clearQuery = "DELETE FROM document_authors WHERE document_id = $1";
    await client.queryObject(clearQuery, [documentId]);
    console.log(`Cleared existing author relationships for document ID: ${documentId}`);
    
    // Process each author
    const results: DocumentAuthor[] = [];
    
    for (let i = 0; i < authors.length; i++) {
      const authorName = authors[i].trim();
      if (!authorName) continue;
      
      // Get or create the author
      const author = await getOrCreateAuthor(authorName);
      
      // Create the document-author relationship with order
      const insertQuery = `
        INSERT INTO document_authors (
          document_id, 
          author_id,
          author_order
        ) VALUES (
          $1, $2, $3
        ) RETURNING *
      `;
      
      const insertResult = await client.queryObject(insertQuery, [documentId, author.id, i + 1]);
      
      if (insertResult.rows.length === 0) {
        throw new Error(`Failed to create document-author relationship for author: ${authorName}`);
      }
      
      console.log(`Created document-author relationship for document ID: ${documentId}, author: ${authorName}, order: ${i+1}`);
      results.push(insertResult.rows[0] as unknown as DocumentAuthor);
    }
    
    return results;
  } catch (error) {
    console.error("Error creating document-author relationships:", error);
    throw new Error(`Failed to create document-author relationships: ${(error as Error).message}`);
  }
}

/**
 * Get authors for a document
 * @param documentId The document ID
 * @returns Array of authors with their order
 */
export async function getDocumentAuthors(documentId: string): Promise<(Author & { author_order: number })[]> {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }
    
    const query = `
      SELECT a.*, da.author_order 
      FROM authors a
      JOIN document_authors da ON a.id = da.author_id
      WHERE da.document_id = $1
      ORDER BY da.author_order ASC
    `;
    
    const result = await client.queryObject(query, [documentId]);
    return result.rows as unknown as (Author & { author_order: number })[];
  } catch (error) {
    console.error("Error getting document authors:", error);
    throw new Error(`Failed to get document authors: ${(error as Error).message}`);
  }
} 