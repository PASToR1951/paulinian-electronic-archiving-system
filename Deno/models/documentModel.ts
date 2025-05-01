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
  compiled_document_id?: number; // Reference to compiled_documents table (legacy field)
  compiled_parent_id?: number; // Direct reference to compiled_documents table
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
          file_path, pages, volume, issue, is_public, document_type,
          compiled_parent_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
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
          document.document_type,
          document.compiled_parent_id || null
        ]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  /**
   * Update a document by ID
   * @param id Document ID
   * @param updates Fields to update
   * @returns Updated document or null if update failed
   */
  static async update(id: number, updates: Partial<Document>): Promise<Document | null> {
    try {
      // Build update query dynamically based on what fields are provided
      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Map of fields to their parameter indices
      const fields: Record<string, any> = {
        title: updates.title,
        description: updates.description,
        abstract: updates.abstract,
        publication_date: updates.publication_date,
        start_year: updates.start_year,
        end_year: updates.end_year,
        category_id: updates.category_id,
        department_id: updates.department_id,
        file_path: updates.file_path,
        pages: updates.pages,
        volume: updates.volume,
        issue: updates.issue,
        is_public: updates.is_public,
        document_type: updates.document_type,
        compiled_parent_id: updates.compiled_parent_id
      };
      
      // Add fields that are not undefined to the query
      for (const [field, value] of Object.entries(fields)) {
        if (value !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
        }
      }
      
      // Always add updated_at timestamp
      updateFields.push(`updated_at = NOW()`);
      
      // If no fields to update, return the current document
      if (updateFields.length === 0) {
        return this.getById(id);
      }
      
      // Add document ID as the last parameter
      queryParams.push(id);
      
      const result = await client.queryObject(
        `UPDATE documents 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex} AND deleted_at IS NULL
         RETURNING *`,
        queryParams
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
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
