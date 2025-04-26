/**
 * Author service - handles business logic for author operations
 */

import { client } from "../data/denopost_conn.ts";
import { AppError, badRequest, notFound } from "../utils/errors.ts";
import { 
  AuthorEntity, 
  AuthorResponse, 
  CreateAuthorData, 
  UpdateAuthorData,
  generateSpudId
} from "../models/author.ts";

/**
 * Get all authors with optional filtering
 */
export async function getAllAuthors(includeDeleted = false, searchQuery = ''): Promise<AuthorEntity[]> {
  try {
    // Build WHERE clause based on parameters
    let whereClause = !includeDeleted ? 'WHERE a.deleted_at IS NULL' : '';
    const params: string[] = [];
    
    // Add search query if provided
    if (searchQuery) {
      const searchParam = `%${searchQuery.toLowerCase()}%`;
      whereClause = whereClause 
        ? `${whereClause} AND LOWER(a.full_name) LIKE $1` 
        : `WHERE LOWER(a.full_name) LIKE $1`;
      params.push(searchParam);
    }
    
    // Execute the query
    const result = await client.queryObject<AuthorEntity>(`
      SELECT 
        a.author_id, 
        a.full_name, 
        a.department, 
        a.email,
        a.affiliation,
        a.year_of_graduation,
        a.linkedin,
        a.biography,
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
      ${whereClause}
      GROUP BY 
        a.author_id, a.full_name, a.department, a.email, a.affiliation, a.year_of_graduation,
        a.linkedin, a.biography, a.orcid_id, a.profile_picture, a.deleted_at
      ORDER BY 
        a.full_name
    `, params);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getAllAuthors:', error);
    throw error;
  }
}

/**
 * Get author by ID
 */
export async function getAuthorById(id: string): Promise<AuthorEntity> {
  try {
    const result = await client.queryObject<AuthorEntity>(`
      SELECT 
        a.author_id, 
        a.full_name, 
        a.department, 
        a.email,
        a.affiliation,
        a.year_of_graduation,
        a.linkedin,
        a.biography,
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
      WHERE 
        a.author_id = ?
      GROUP BY 
        a.author_id, a.full_name, a.department, a.email, a.affiliation, a.year_of_graduation,
        a.linkedin, a.biography, a.orcid_id, a.profile_picture, a.deleted_at
    `, [id]);
    
    if (result.rows.length === 0) {
      throw notFound(`Author with ID ${id}`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error in getAuthorById for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get documents by author ID
 */
export async function getDocumentsByAuthor(authorId: string) {
  try {
    const result = await client.queryObject(`
      SELECT 
        d.id, 
        d.title, 
        d.publication_date, 
        d.file, 
        d.abstract,
        c.category_name,
        ARRAY_AGG(DISTINCT a.full_name) as author_names
      FROM 
        documents d
      JOIN 
        document_authors da ON d.id = da.document_id
      JOIN 
        authors a ON da.author_id = a.author_id
      LEFT JOIN 
        categories c ON d.category_id = c.id
      WHERE 
        da.author_id = ?
      GROUP BY 
        d.id, d.title, d.publication_date, d.file, d.abstract, c.category_name
      ORDER BY 
        d.publication_date DESC
    `, [authorId]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error in getDocumentsByAuthor for ID ${authorId}:`, error);
    throw error;
  }
}

/**
 * Create a new author
 */
export async function createAuthor(data: CreateAuthorData): Promise<AuthorEntity> {
  try {
    if (!data.full_name) {
      throw badRequest('Author name is required');
    }

    const result = await client.queryObject<AuthorEntity>(`
      INSERT INTO authors (
        full_name, 
        department, 
        email, 
        affiliation, 
        year_of_graduation, 
        linkedin, 
        biography, 
        orcid_id, 
        profile_picture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING 
        author_id, 
        full_name, 
        department, 
        email, 
        affiliation, 
        year_of_graduation, 
        linkedin, 
        biography, 
        orcid_id, 
        profile_picture,
        created_at,
        updated_at,
        deleted_at
    `, [
      data.full_name,
      data.department || null,
      data.email || null,
      data.affiliation || null,
      data.year_of_graduation || null,
      data.linkedin || null,
      data.biography || null,
      data.orcid_id || null,
      data.profile_picture || null
    ]);

    return result.rows[0];
  } catch (error) {
    console.error('Error in createAuthor:', error);
    throw error;
  }
}

/**
 * Update an existing author
 */
export async function updateAuthor(id: string, data: UpdateAuthorData): Promise<AuthorEntity> {
  try {
    // Build the update query dynamically based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    
    // Add fields that are present in the update data
    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(data.full_name);
    }
    
    if (data.department !== undefined) {
      fields.push('department = ?');
      values.push(data.department);
    }
    
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    
    if (data.affiliation !== undefined) {
      fields.push('affiliation = ?');
      values.push(data.affiliation);
    }
    
    if (data.year_of_graduation !== undefined) {
      fields.push('year_of_graduation = ?');
      values.push(data.year_of_graduation);
    }
    
    if (data.linkedin !== undefined) {
      fields.push('linkedin = ?');
      values.push(data.linkedin);
    }
    
    if (data.biography !== undefined) {
      fields.push('biography = ?');
      values.push(data.biography);
    }
    
    if (data.orcid_id !== undefined) {
      fields.push('orcid_id = ?');
      values.push(data.orcid_id);
    }
    
    if (data.profile_picture !== undefined) {
      fields.push('profile_picture = ?');
      values.push(data.profile_picture);
    }
    
    if (fields.length === 0) {
      throw badRequest('No fields to update');
    }
    
    // Add ID as the last parameter
    values.push(id);
    
    const result = await client.queryObject<AuthorEntity>(`
      UPDATE authors 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE author_id = ?
      RETURNING 
        author_id, 
        full_name, 
        department, 
        email, 
        affiliation, 
        year_of_graduation, 
        linkedin, 
        biography, 
        orcid_id, 
        profile_picture,
        deleted_at
    `, values);
    
    if (result.rows.length === 0) {
      throw notFound(`Author with ID ${id}`);
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
export async function deleteAuthor(id: string): Promise<{ author_id: string; deleted_at: Date | null; already_deleted: boolean }> {
  try {
    // First check if the author exists and if it's already deleted
    const checkResult = await client.queryObject(`
      SELECT author_id, deleted_at FROM authors WHERE author_id = ?
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      throw notFound(`Author with ID ${id}`);
    }
    
    // If the author is already deleted, return it with appropriate flag
    if (checkResult.rows[0].deleted_at !== null) {
      return {
        author_id: id,
        deleted_at: checkResult.rows[0].deleted_at,
        already_deleted: true
      };
    }
    
    // Otherwise, proceed with the deletion
    const result = await client.queryObject(`
      UPDATE authors 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE author_id = ? AND deleted_at IS NULL 
      RETURNING author_id, deleted_at
    `, [id]);
    
    // This should never happen since we checked existence above, but just in case
    if (result.rows.length === 0) {
      return {
        author_id: id,
        deleted_at: null,
        already_deleted: true
      };
    }
    
    return { 
      ...result.rows[0], 
      already_deleted: false 
    };
  } catch (error) {
    console.error(`Error soft deleting author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Restore a deleted author
 */
export async function restoreAuthor(id: string): Promise<AuthorEntity> {
  try {
    const result = await client.queryObject<AuthorEntity>(`
      UPDATE authors 
      SET deleted_at = NULL 
      WHERE author_id = ? AND deleted_at IS NOT NULL 
      RETURNING 
        author_id, 
        full_name, 
        department, 
        email, 
        affiliation, 
        year_of_graduation, 
        linkedin, 
        biography, 
        orcid_id, 
        profile_picture,
        deleted_at
    `, [id]);
    
    if (result.rows.length === 0) {
      throw badRequest(`Author with ID ${id} is not in trash or doesn't exist`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error restoring author with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Map database author entity to API response format
 */
export function mapAuthorToResponse(author: AuthorEntity, gender = 'M'): AuthorResponse {
  return {
    author_id: author.author_id,
    id: generateSpudId(author, gender),
    name: author.full_name,
    department: author.department || '',
    email: author.email || '',
    affiliation: author.affiliation || '',
    documentCount: author.document_count ? Number(author.document_count) : 0,
    orcid: author.orcid_id || '',
    biography: author.biography || '',
    profilePicture: author.profile_picture || '',
    yearOfGraduation: author.year_of_graduation || '',
    linkedin: author.linkedin || '',
    gender,
    deleted_at: author.deleted_at
  };
}
