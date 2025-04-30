import { client } from "../db/denopost_conn.ts";

/**
 * Document types as defined in the database enum
 */
export enum DocumentType {
  THESIS = 'THESIS',
  DISSERTATION = 'DISSERTATION',
  CONFLUENCE = 'CONFLUENCE',
  SYNERGY = 'SYNERGY'
}

/**
 * Document interface representing the document data from the database
 */
export interface Document {
  id: number;
  title: string;
  description?: string;
  abstract?: string;
  publication_date?: Date;
  start_year?: number;
  end_year?: number;
  category_id?: number;
  department_id?: number;
  file_path: string;
  pages?: number;
  volume?: string;
  issue?: string;
  is_public: boolean;
  document_type: DocumentType;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * File interface representing file data from the database
 */
export interface DocumentFile {
  id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  document_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export class DocumentModel {
  /**
   * Get all documents (optionally only public ones)
   * @param publicOnly Whether to only fetch public documents
   * @returns Array of documents
   */
  static async getAll(publicOnly = false): Promise<Document[]> {
    try {
      let query = "SELECT * FROM documents WHERE deleted_at IS NULL";
      
      if (publicOnly) {
        query += " AND is_public = true";
      }
      
      query += " ORDER BY created_at DESC";
      
      const result = await client.queryObject<Document>(query);
      return result.rows;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  }

  /**
   * Get a document by its ID
   * @param id Document ID
   * @returns Document object or null if not found
   */
  static async getById(id: number): Promise<Document | null> {
    try {
      const result = await client.queryObject<Document>(
        "SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching document:", error);
      return null;
    }
  }

  /**
   * Get a document with its author information
   * @param id Document ID
   * @returns Document with authors or null if not found
   */
  static async getWithAuthors(id: number): Promise<any | null> {
    try {
      // First get the document
      const document = await this.getById(id);
      
      if (!document) {
        return null;
      }
      
      // Then get its authors
      const authorsResult = await client.queryObject(
        `SELECT a.* 
         FROM authors a
         JOIN document_authors da ON a.id = da.author_id
         WHERE da.document_id = $1
         ORDER BY da.author_order`,
        [id]
      );
      
      return {
        ...document,
        authors: authorsResult.rows
      };
    } catch (error) {
      console.error("Error fetching document with authors:", error);
      return null;
    }
  }

  /**
   * Search for documents by title, abstract, or description
   * @param searchTerm Search term
   * @param publicOnly Whether to only search public documents
   * @returns Array of matching documents
   */
  static async search(searchTerm: string, publicOnly = false): Promise<Document[]> {
    try {
      let query = `
        SELECT * FROM documents 
        WHERE deleted_at IS NULL 
        AND (
          title ILIKE $1 
          OR description ILIKE $1 
          OR abstract ILIKE $1
        )
      `;
      
      if (publicOnly) {
        query += " AND is_public = true";
      }
      
      query += " ORDER BY created_at DESC";
      
      const result = await client.queryObject<Document>(
        query,
        [`%${searchTerm}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error("Error searching documents:", error);
      return [];
    }
  }

  /**
   * Create a new document
   * @param document Document data
   * @returns Created document or null if creation failed
   */
  static async create(document: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Document | null> {
    try {
      const result = await client.queryObject(
        `INSERT INTO documents (
          title, description, abstract, publication_date, 
          start_year, end_year, category_id, department_id,
          file_path, pages, volume, issue, is_public, document_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *`,
        [
          document.title,
          document.description || null,
          document.abstract || null,
          document.publication_date || null,
          document.start_year || null,
          document.end_year || null,
          document.category_id || null,
          document.department_id || null,
          document.file_path,
          document.pages || null,
          document.volume || null,
          document.issue || null,
          document.is_public || false,
          document.document_type
        ]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating document:", error);
      return null;
    }
  }

  /**
   * Update a document
   * @param id Document ID
   * @param updates Fields to update
   * @returns Updated document or null if update failed
   */
  static async update(id: number, updates: Partial<Document>): Promise<Document | null> {
    try {
      // Build SET clause and values dynamically based on provided updates
      const setValues: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      // Add updated_at to the updates
      updates.updated_at = new Date();
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && value !== undefined) {
          setValues.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (setValues.length === 0) {
        return await this.getById(id); // Nothing to update
      }
      
      values.push(id); // Add id as the last parameter
      
      const result = await client.queryObject<Document>(
        `UPDATE documents
         SET ${setValues.join(', ')}
         WHERE id = $${paramCount} AND deleted_at IS NULL
         RETURNING *`,
        values
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating document:", error);
      return null;
    }
  }

  /**
   * Soft delete a document by setting its deleted_at timestamp
   * @param id Document ID
   * @returns True if successful, false otherwise
   */
  static async softDelete(id: number): Promise<boolean> {
    try {
      const result = await client.queryArray(
        "UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error soft deleting document:", error);
      return false;
    }
  }

  /**
   * Hard delete a document (for use by admin or for permanent deletion)
   * @param id Document ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: number): Promise<boolean> {
    try {
      // First soft delete for safety
      await this.softDelete(id);
      
      // Then actually delete the document
      const result = await client.queryObject(
        "DELETE FROM documents WHERE id = $1",
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }

  /**
   * Get filtered documents based on multiple criteria
   * @param options Filter options
   * @returns Array of filtered documents
   */
  static async getFiltered(options: {
    categoryId?: number;
    authorId?: number;
    searchTerm?: string;
    publicOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Document[]> {
    try {
      const {
        categoryId,
        authorId,
        searchTerm,
        publicOnly = false,
        page = 1,
        limit = 20
      } = options;
      
      const offset = (page - 1) * limit;
      const params: any[] = [];
      let paramIndex = 1;
      
      let query = "SELECT DISTINCT d.* FROM documents d ";
      
      // Join with document_authors if we need to filter by author
      if (authorId) {
        query += "JOIN document_authors da ON d.id = da.document_id ";
      }
      
      query += "WHERE d.deleted_at IS NULL ";
      
      // Apply filters
      if (categoryId) {
        query += `AND d.category_id = $${paramIndex} `;
        params.push(categoryId);
        paramIndex++;
      }
      
      if (authorId) {
        query += `AND da.author_id = $${paramIndex} `;
        params.push(authorId);
        paramIndex++;
      }
      
      if (searchTerm) {
        query += `AND (
          d.title ILIKE $${paramIndex} 
          OR d.description ILIKE $${paramIndex} 
          OR d.abstract ILIKE $${paramIndex}
        ) `;
        params.push(`%${searchTerm}%`);
        paramIndex++;
      }
      
      if (publicOnly) {
        query += "AND d.is_public = true ";
      }
      
      // Add ordering
      query += "ORDER BY d.created_at DESC ";
      
      // Add pagination
      query += `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await client.queryObject<Document>(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error fetching filtered documents:", error);
      return [];
    }
  }

  /**
   * Add an author to a document
   * @param documentId Document ID
   * @param authorId Author ID
   * @param authorOrder Order of the author in the document
   * @returns True if successful, false otherwise
   */
  static async addAuthor(documentId: number, authorId: string, authorOrder: number): Promise<boolean> {
    try {
      await client.queryArray(
        "INSERT INTO document_authors (document_id, author_id, author_order) VALUES ($1, $2, $3)",
        [documentId, authorId, authorOrder]
      );
      
      return true;
    } catch (error) {
      console.error("Error adding author to document:", error);
      return false;
    }
  }

  /**
   * Get all files associated with a document
   * @param documentId Document ID
   * @returns Array of file objects
   */
  static async getFiles(documentId: number): Promise<DocumentFile[]> {
    try {
      const result = await client.queryObject<DocumentFile>(
        "SELECT * FROM files WHERE document_id = $1 ORDER BY id",
        [documentId]
      );
      
      return result.rows;
    } catch (error) {
      console.error("Error fetching document files:", error);
      return [];
    }
  }

  /**
   * Add a file to a document
   * @param file File data
   * @returns Created file object or null if creation failed
   */
  static async addFile(file: Omit<DocumentFile, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentFile | null> {
    try {
      const result = await client.queryObject<DocumentFile>(
        `INSERT INTO files (file_name, file_path, file_size, file_type, document_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          file.file_name,
          file.file_path,
          file.file_size || null,
          file.file_type || null,
          file.document_id
        ]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error adding file to document:", error);
      return null;
    }
  }
}

/**
 * Helper function to convert BigInt values to regular numbers for JSON serialization
 * This function is used internally and doesn't affect the typings of the main methods
 */
function processRowsForSerialization(rows: any): any {
  // If it's a single object (single row result)
  if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
    const processed = { ...rows };
    
    // Convert any BigInt values to numbers
    for (const key in processed) {
      if (typeof processed[key] === 'bigint') {
        processed[key] = Number(processed[key]);
      }
    }
    
    return processed;
  }
  
  // If it's an array of objects (multiple rows)
  if (Array.isArray(rows)) {
    return rows.map(row => {
      const processed = { ...row };
      
      // Convert any BigInt values to numbers
      for (const key in processed) {
        if (typeof processed[key] === 'bigint') {
          processed[key] = Number(processed[key]);
        }
      }
      
      return processed;
    });
  }
  
  // If it's neither an object nor an array, return as is
  return rows;
}
