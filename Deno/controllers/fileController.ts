// File controller for database operations

import { client } from "../db/denopost_conn.ts";

interface FileData {
  id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  document_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Create a new file record in the database
 * @param fileData The file data to create
 * @returns The created file
 */
export async function createFile(fileData: FileData) {
  try {
    const { file_name, file_path, file_size, file_type, document_id } = fileData;
    
    const query = `
      INSERT INTO files (
        file_name, 
        file_path, 
        file_size, 
        file_type, 
        document_id, 
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING *
    `;
    
    const params = [
      file_name,
      file_path,
      file_size || null,
      file_type || null,
      document_id || null
    ];
    
    const result = await client.queryObject(query, params);
    return result.rows[0];
  } catch (error) {
    console.error("Database error creating file:", error);
    throw new Error(`Failed to create file record: ${(error as Error).message}`);
  }
}

/**
 * Get a file by ID
 * @param id The file ID
 * @returns The file or null if not found
 */
export async function getFileById(id: string) {
  try {
    const query = "SELECT * FROM files WHERE id = $1";
    const result = await client.queryObject(query, [id]);
    
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Database error getting file:", error);
    throw new Error(`Failed to get file: ${(error as Error).message}`);
  }
}

/**
 * Get files by document ID
 * @param documentId The document ID
 * @returns Array of files
 */
export async function getFilesByDocumentId(documentId: string) {
  try {
    const query = "SELECT * FROM files WHERE document_id = $1";
    const result = await client.queryObject(query, [documentId]);
    
    return result.rows;
  } catch (error) {
    console.error("Database error getting files by document ID:", error);
    throw new Error(`Failed to get files by document ID: ${(error as Error).message}`);
  }
}

/**
 * Update a file record
 * @param id The file ID
 * @param fileData The updated file data
 * @returns The updated file
 */
export async function updateFile(id: string, fileData: Partial<FileData>) {
  try {
    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(fileData)) {
      if (key !== 'id' && key !== 'created_at') { // Skip id and created_at
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE files 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await client.queryObject(query, values);
    
    if (result.rows.length === 0) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Database error updating file:", error);
    throw new Error(`Failed to update file: ${(error as Error).message}`);
  }
}

/**
 * Delete a file record
 * @param id The file ID
 * @returns True if successful
 */
export async function deleteFile(id: string) {
  try {
    const query = "DELETE FROM files WHERE id = $1 RETURNING id";
    const result = await client.queryObject(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    return true;
  } catch (error) {
    console.error("Database error deleting file:", error);
    throw new Error(`Failed to delete file: ${(error as Error).message}`);
  }
} 