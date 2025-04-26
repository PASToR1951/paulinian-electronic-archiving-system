// Type definitions for the API module

export interface Author {
  author_id: string;
  id?: string;
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number | null;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
  deleted_at?: string | null;
}

export function fetchAuthors(): Promise<Author[]>;
export function fetchAuthorById(id: string): Promise<Author>;
export function fetchDocumentsByAuthor(authorId: string): Promise<any[]>;
export function updateAuthor(id: string, authorData: Partial<Author>): Promise<Author>;
