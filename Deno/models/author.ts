/**
 * Author model interface definitions
 */

// Database Author Entity
export interface AuthorEntity {
  author_id: string;
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number | null;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  document_count?: number | bigint; // Add document count for query results
}

// API Author Response 
export interface AuthorResponse {
  author_id: string;       // UUID primary key for database operations
  id: string;              // SPUD ID for display
  name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  documentCount?: number;
  orcid?: string;
  biography?: string;
  profilePicture?: string;
  yearOfGraduation?: number | null | string;
  linkedin?: string;
  gender?: string;         // 'M' or 'F'
  deleted_at?: Date | null | string;
}

// Author creation input
export interface CreateAuthorData {
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number | null;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
  gender?: string;
}

// Author update input
export interface UpdateAuthorData {
  full_name?: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number | null;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
  gender?: string;
}

/**
 * Generate a SPUD ID for an author
 */
export function generateSpudId(author: Partial<AuthorEntity>, gender = 'M'): string {
  const year = author.year_of_graduation || new Date().getFullYear();
  const initials = author.full_name 
    ? author.full_name.substring(0, 3).toUpperCase() 
    : 'XXX';
  
  return `SPUD-${gender}-${year}-${initials}`;
}