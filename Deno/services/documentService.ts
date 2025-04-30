import { client } from "../db/denopost_conn.ts";

// Define interfaces for our data structures
interface Document {
  id: number;
  title: string;
  description?: string;
  abstract: string;
  publication_date: string;
  category_name: string;
  department_id?: number;
  document_type: string;
  file_path: string;
  pages?: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  volume?: string;
  issue?: string;
  start_year?: number;
  end_year?: number;
  parent_document_id?: number;
  authors: Author[];
  topics: Topic[];
}

interface Author {
  id: number;
  full_name: string;
}

interface Topic {
  id: number;
  name: string;
}

interface DocumentsResponse {
  documents: Document[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface ChildDocumentsResponse {
  documents: Document[];
}

/**
 * Fetches documents from the database with filtering, sorting, and pagination
 * @param category Optional category filter
 * @param page Page number for pagination
 * @param size Number of items per page
 * @param sort Sort order ('latest' or 'earliest')
 * @returns Object containing documents, totalCount, totalPages, and currentPage
 */
export async function fetchDocuments(category?: string, page: number = 1, size: number = 20, sort: string = 'latest'): Promise<DocumentsResponse> {
  try {
    // Build SQL query with proper pagination and filtering
    let query = `
      SELECT 
        d.id, 
        d.title, 
        d.description,
        d.abstract, 
        d.publication_date, 
        c.category_name, 
        d.department_id,
        d.document_type,
        d.file_path,
        d.pages,
        d.is_public,
        d.created_at,
        d.updated_at,
        d.volume,
        d.issue,
        d.start_year,
        d.end_year
      FROM 
        documents d
      JOIN 
        categories c ON d.category_id = c.id
      WHERE 
        d.deleted_at IS NULL
    `;
    
    const queryParams: any[] = [];
    let paramCount = 1;
    
    // Add category filter if specified
    if (category && category !== 'All') {
      query += ` AND c.category_name ILIKE $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }
    
    // Calculate total count with the same filters (but without pagination)
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM documents d 
      JOIN categories c ON d.category_id = c.id 
      WHERE d.deleted_at IS NULL
      ${category && category !== 'All' ? `AND c.category_name ILIKE $1` : ''}
    `;
    
    // Execute count query
    const countResult = await client.queryObject(countQuery, 
      category && category !== 'All' ? [category] : []);
    const totalCount = parseInt(String((countResult.rows[0] as { total: unknown }).total));
    
    // Add sorting
    if (sort === 'latest') {
      query += ` ORDER BY d.publication_date DESC, d.created_at DESC`;
    } else if (sort === 'earliest') {
      query += ` ORDER BY d.publication_date ASC, d.created_at ASC`;
    }
    
    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(size);
    queryParams.push((page - 1) * size);
    
    // Execute main query
    const result = await client.queryObject(query, queryParams);
    
    // Process documents to include authors and topics
    const documents: Document[] = [];
    for (const row of result.rows) {
      const doc = row as Record<string, any>;
      // Convert BigInt values to regular numbers
      const id = typeof doc.id === 'bigint' ? Number(doc.id) : doc.id as number;
      const pages = typeof doc.pages === 'bigint' ? Number(doc.pages) : doc.pages as number;
      
      // Fetch authors for this document
      const authors = await getDocumentAuthors(id);
      
      // Fetch topics/research agenda for this document
      const topics = await getDocumentTopics(id);
      
      // Add complete document to results
      documents.push({
        ...doc as any,
        id,
        pages,
        authors,
        topics
      } as Document);
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / size);
    
    // Return formatted response
    return {
      documents,
      totalCount,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
}

/**
 * Fetches child documents of a parent document
 * @param parentId The ID of the parent document
 * @returns Array of child documents
 */
export async function fetchChildDocuments(parentId: number | string): Promise<ChildDocumentsResponse> {
  try {
    // Query to get child documents for a parent document
    const query = `
      SELECT 
        d.id, 
        d.title,
        d.description,
        d.abstract, 
        d.publication_date, 
        c.category_name,
        d.department_id,
        d.document_type,
        d.file_path,
        d.pages,
        d.is_public,
        d.created_at,
        d.updated_at,
        d.parent_document_id
      FROM 
        documents d
      JOIN 
        categories c ON d.category_id = c.id
      WHERE 
        d.parent_document_id = $1
        AND d.deleted_at IS NULL
      ORDER BY
        d.publication_date DESC, d.created_at DESC
    `;
    
    const result = await client.queryObject(query, [parentId]);
    
    // Process documents to include authors and topics
    const documents: Document[] = [];
    for (const row of result.rows) {
      const doc = row as Record<string, any>;
      // Convert BigInt values to regular numbers
      const id = typeof doc.id === 'bigint' ? Number(doc.id) : doc.id as number;
      const pages = typeof doc.pages === 'bigint' ? Number(doc.pages) : doc.pages as number;
      const parentDocId = typeof doc.parent_document_id === 'bigint' ? 
        Number(doc.parent_document_id) : doc.parent_document_id as number;
      
      // Fetch authors for this document
      const authors = await getDocumentAuthors(id);
      
      // Fetch topics/research agenda for this document
      const topics = await getDocumentTopics(id);
      
      // Add complete document to results
      documents.push({
        ...doc as any,
        id,
        pages,
        parent_document_id: parentDocId,
        authors,
        topics
      } as Document);
    }
    
    return { documents };
  } catch (error) {
    console.error(`Error fetching child documents for parent ID ${parentId}:`, error);
    throw error;
  }
}

/**
 * Helper function to fetch authors for a document
 * @param documentId The document ID
 * @returns Array of authors
 */
async function getDocumentAuthors(documentId: number): Promise<Author[]> {
  const authorsQuery = `
    SELECT a.id, a.full_name 
    FROM authors a
    JOIN document_authors da ON a.id = da.author_id
    WHERE da.document_id = $1
  `;
  const authorsResult = await client.queryObject(authorsQuery, [documentId]);
  return authorsResult.rows.map(row => {
    const author = row as Record<string, any>;
    return {
      id: typeof author.id === 'bigint' ? Number(author.id) : author.id as number,
      full_name: author.full_name as string
    };
  });
}

/**
 * Helper function to fetch topics (research agenda) for a document
 * @param documentId The document ID
 * @returns Array of topics
 */
async function getDocumentTopics(documentId: number): Promise<Topic[]> {
  try {
    const topicsQuery = `
      SELECT ra.id, ra.name as name 
      FROM research_agenda ra
      JOIN document_research_agenda dra ON ra.id = dra.research_agenda_id
      WHERE dra.document_id = $1
    `;
    const topicsResult = await client.queryObject(topicsQuery, [documentId]);
    return topicsResult.rows.map(row => {
      const topic = row as Record<string, any>;
      return {
        id: typeof topic.id === 'bigint' ? Number(topic.id) : topic.id as number,
        name: topic.name as string
      };
    });
  } catch (error) {
    console.error(`Error fetching research agenda for document ID ${documentId}:`, error);
    // Return empty array instead of throwing an error
    return [];
  }
}
