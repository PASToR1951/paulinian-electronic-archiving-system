import { client } from "../db/denopost_conn.ts";

/**
 * Author interface representing author data from the database
 */
export interface Author {
  id: string; // UUID in the database
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

export class AuthorModel {
  /**
   * Get all authors
   * @returns Array of authors
   */
  static async getAll(): Promise<Author[]> {
    try {
      const result = await client.queryObject<Author>(
        "SELECT * FROM authors ORDER BY full_name"
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching authors:", error);
      return [];
    }
  }

  /**
   * Get an author by their ID
   * @param id Author ID (UUID)
   * @returns Author object or null if not found
   */
  static async getById(id: string): Promise<Author | null> {
    try {
      const result = await client.queryObject<Author>(
        "SELECT * FROM authors WHERE id = $1",
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching author:", error);
      return null;
    }
  }

  /**
   * Get an author by their SPUD ID
   * @param spudId SPUD ID
   * @returns Author object or null if not found
   */
  static async getBySpudId(spudId: string): Promise<Author | null> {
    try {
      const result = await client.queryObject<Author>(
        "SELECT * FROM authors WHERE spud_id = $1",
        [spudId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching author by SPUD ID:", error);
      return null;
    }
  }

  /**
   * Create a new author
   * @param author Author data
   * @returns Created author or null if creation failed
   */
  static async create(author: Omit<Author, 'id' | 'created_at' | 'updated_at'>): Promise<Author | null> {
    try {
      const result = await client.queryObject<Author>(
        `INSERT INTO authors (
          spud_id, full_name, affiliation, department, 
          email, orcid_id, biography, profile_picture
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          author.spud_id || null,
          author.full_name,
          author.affiliation || null,
          author.department || null,
          author.email || null,
          author.orcid_id || null,
          author.biography || null,
          author.profile_picture || null
        ]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating author:", error);
      return null;
    }
  }

  /**
   * Update an author's data
   * @param authorId The ID of the author to update
   * @param updateData The data to update
   * @returns The updated author, or null if not found
   */
  static async update(authorId: string, updateData: Partial<Author>): Promise<Author | null> {
    try {
      // Build SET clause and values dynamically based on provided updates
      const setValues: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      // Add updated_at to the updates
      updateData.updated_at = new Date();
      
      Object.entries(updateData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && value !== undefined) {
          setValues.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (setValues.length === 0) {
        return await this.getById(authorId); // Nothing to update
      }
      
      values.push(authorId); // Add id as the last parameter
      
      const result = await client.queryObject<Author>(
        `UPDATE authors
         SET ${setValues.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating author:", error);
      return null;
    }
  }

  /**
   * Update an author's ID
   * @param oldId The current ID of the author
   * @param newId The new ID to set
   * @returns Boolean indicating success
   */
  static async updateId(oldId: string, newId: string): Promise<boolean> {
    try {
      // Update the ID in the database
      const result = await client.queryObject(
        `UPDATE authors SET id = $1 WHERE id = $2 RETURNING *`,
        [newId, oldId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error updating author ID from ${oldId} to ${newId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an author
   * @param id Author ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await client.queryArray(
        "DELETE FROM authors WHERE id = $1",
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting author:", error);
      return false;
    }
  }

  /**
   * Get all documents by an author
   * @param authorId Author ID
   * @returns Array of document IDs authored by this author
   */
  static async getDocuments(authorId: string): Promise<number[]> {
    try {
      const result = await client.queryArray<[number]>(
        `SELECT document_id
         FROM document_authors
         WHERE author_id = $1
         ORDER BY author_order`,
        [authorId]
      );
      
      return result.rows.map(row => row[0]);
    } catch (error) {
      console.error("Error fetching author's documents:", error);
      return [];
    }
  }

  /**
   * Search for authors by name
   * @param searchTerm Search term
   * @returns Array of matching authors
   */
  static async search(searchTerm: string): Promise<Author[]> {
    try {
      const result = await client.queryObject<Author>(
        `SELECT * FROM authors
         WHERE full_name ILIKE $1
         OR affiliation ILIKE $1
         OR department ILIKE $1
         ORDER BY full_name`,
        [`%${searchTerm}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error("Error searching authors:", error);
      return [];
    }
  }

  /**
   * Search authors by name
   * @param searchTerm Search term to find authors matching the name
   * @returns Array of authors matching the search term
   */
  static async searchByName(searchTerm: string): Promise<Author[]> {
    try {
      const query = `
        SELECT * FROM authors 
        WHERE full_name ILIKE $1
        ORDER BY full_name ASC 
        LIMIT 10
      `;
      
      const result = await client.queryObject(
        query,
        [`%${searchTerm}%`]
      );
      
      return result.rows as Author[];
    } catch (error) {
      console.error("Error searching authors:", error);
      return [];
    }
  }
}
