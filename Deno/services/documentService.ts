import { client } from "../db/denopost_conn.ts";

// Define interfaces for our data structures
export interface DocumentOptions {
  page?: number;
  limit?: number;
  category?: string | null;
  search?: string | null;
  sort?: string;
  order?: string;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  publication_date?: Date | null;
  document_type: string;
  volume?: string;
  issue?: string;
  authors: Author[];
  topics: Topic[];
  is_compiled?: boolean;
  child_count?: number;
  parent_compiled_id?: number | null;
}

interface Author {
  id: number;
  full_name?: string;
}

interface Topic {
  id: number;
  name: string;
}

export interface DocumentsResponse {
  documents: Document[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  error?: string;
}

interface ChildDocumentsResponse {
  documents: Document[];
}

// Add interface for compiled document
export interface CompiledDocument {
  id: number;
  title?: string;
  start_year?: number;
  end_year?: number;
  volume?: number;
  issue_number?: number;
  department?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
  document_count?: number;
}

/**
 * Fetches documents from the database with filtering, sorting, and pagination
 * Handles both regular and compiled documents in a single query
 */
export async function fetchDocuments(
  options: DocumentOptions = {}
): Promise<DocumentsResponse> {
  try {
    console.log(`Fetching documents with options: ${JSON.stringify(options)}`);
    
    const {
      page = 1,
      limit = 10,
      category = null,
      search = null,
      sort = 'id',
      order = 'ASC',
    } = options;
    
    // Build the parameters array
    const params: any[] = [];
    let paramIndex = 1;
    
    // Validate sort field and order to prevent SQL injection
    const validSortFields = ['id', 'title', 'publication_date', 'document_type', 'created_at'];
    const validOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sort) ? sort : 'id';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';
    
    // For search filtering
    let searchWhereClause = '';
    if (search) {
      searchWhereClause = `AND (
        d.title ILIKE $${paramIndex} OR 
        d.description ILIKE $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM authors a 
          JOIN document_authors da ON a.id = da.author_id
          WHERE da.document_id = d.id AND a.full_name ILIKE $${paramIndex}
        )
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // For category filtering in documents
    let categoryDocWhereClause = '';
    if (category && category !== 'All') {
      categoryDocWhereClause = `AND d.document_type = $${paramIndex}::document_type`;
      params.push(category);
      paramIndex++;
    }
    
    // For category filtering in compiled documents
    let categoryCompWhereClause = '';
    if (category && category !== 'All') {
      categoryCompWhereClause = `AND cd.category ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    // Combined query using UNION ALL to fetch both document types in a single query
    // WITH SORTING AND PAGINATION applied to the combined result set
    const query = `
      WITH combined_docs AS (
        -- Regular documents that are not children of compilations
      SELECT 
        d.id, 
          COALESCE(d.title, 'Untitled Document')::TEXT as title,
          COALESCE(d.description, '')::TEXT as description,
        d.publication_date, 
        d.document_type,
          COALESCE(d.volume, '')::TEXT as volume,
          COALESCE(d.issue, '')::TEXT as issue,
          'document'::TEXT as doc_source,
          false as is_parent,
          (
            SELECT COUNT(*) 
            FROM compiled_document_items cdi 
            WHERE cdi.compiled_document_id = d.id
          )::BIGINT as child_count,
          NULL::BIGINT as parent_id
      FROM 
        documents d
      WHERE 
          NOT EXISTS (
            SELECT 1 
            FROM compiled_document_items cdi 
            WHERE cdi.document_id = d.id
          )
          ${categoryDocWhereClause}
          ${searchWhereClause}
          
        UNION ALL
        
        -- Compiled documents from compiled_documents table with DISTINCT ON to avoid duplicates  
        SELECT DISTINCT ON (cd.category, cd.volume, cd.start_year, cd.end_year)
          cd.id,
          CASE 
            WHEN cd.category IS NOT NULL THEN 
              CONCAT(cd.category, ' Vol. ', 
                CASE WHEN cd.volume IS NOT NULL THEN CAST(cd.volume AS TEXT) ELSE '' END,
                CASE 
                  WHEN cd.start_year IS NOT NULL AND cd.end_year IS NOT NULL 
                  THEN CONCAT(' (', cd.start_year, '-', cd.end_year, ')')
                  WHEN cd.start_year IS NOT NULL 
                  THEN CONCAT(' (', cd.start_year, ')')
                  ELSE ''
                END
              )
            ELSE 'Compiled Publication'
          END::TEXT as title,
          ''::TEXT as description,
          NULL as publication_date,
          'CONFLUENCE'::document_type as document_type,
          CASE WHEN cd.volume IS NOT NULL THEN CAST(cd.volume AS TEXT) ELSE NULL END as volume,
          CASE WHEN cd.issue_number IS NOT NULL THEN CAST(cd.issue_number AS TEXT) ELSE NULL END as issue,
          'compiled'::TEXT as doc_source,
          true as is_parent,
          (
            SELECT COUNT(*) 
            FROM compiled_document_items cdi 
            WHERE cdi.compiled_document_id = cd.id
          )::BIGINT as child_count,
          NULL::BIGINT as parent_id
        FROM 
          compiled_documents cd
        WHERE 
          EXISTS (
            SELECT 1 
            FROM compiled_document_items cdi 
            WHERE cdi.compiled_document_id = cd.id
          )
          ${categoryCompWhereClause}
      ),
      count_query AS (
        SELECT COUNT(*) as total_count FROM combined_docs
      )
      -- Main query with sorting and pagination applied to the combined result
      SELECT 
        cd.*, 
        cq.total_count
      FROM 
        combined_docs cd,
        count_query cq
      ORDER BY 
        ${sortField} ${sortOrder} NULLS LAST,
        title ASC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
    
    console.log(`Executing combined query with params:`, params);
    
    const result = await client.queryObject(query, params);
    console.log(`Query returned ${result.rowCount} rows`);
    
    if (result.rowCount === 0) {
      return {
        documents: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      };
    }
    
    // Get total count from the first row
    const totalCount = parseInt(String((result.rows[0] as any).total_count || '0'), 10);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Process documents
    const documents: Document[] = [];
    
    for (const row of result.rows as any[]) {
      console.log(`Processing ${row.doc_source} row:`, row);
      
      // Check if matched_child_documents exists and safely handle it
      if (row.matched_child_documents) {
        console.log('Row has matched_child_documents field, safely handling it');
        // Just log it for debugging but don't use it directly to avoid serialization issues
        try {
          if (typeof row.matched_child_documents === 'string') {
            console.log('matched_child_documents is a string');
          } else if (Array.isArray(row.matched_child_documents)) {
            console.log(`matched_child_documents is an array with ${row.matched_child_documents.length} items`);
          } else if (typeof row.matched_child_documents === 'object') {
            console.log('matched_child_documents is an object');
          }
        } catch (matchedError) {
          console.error('Error processing matched_child_documents:', matchedError);
        }
      }
      
      // Create base document object
      const doc: Document = {
        id: row.id,
        title: row.title || 'Untitled Document',
        description: row.description || '',
        publication_date: row.publication_date ? new Date(row.publication_date) : null,
        document_type: row.document_type || '',
        volume: row.volume || '',
        issue: row.issue || '',
        authors: [],
        topics: [],
        is_compiled: row.is_parent === true,
        child_count: parseInt(String(row.child_count || '0'), 10),
        parent_compiled_id: row.parent_id
      };
      
      // Add a doc_type property for frontend compatibility
      (doc as any).doc_type = row.document_type || '';
      
      // Skip child documents with no children if we're filtering by category
      if (doc.is_compiled && doc.child_count === 0 && category && category !== 'All') {
        console.log(`Skipping empty compiled document ${doc.id} (${doc.title}) when filtering by category`);
        continue;
      }
      
      // Fetch authors for this document if it's not a compiled document
      if (row.doc_source === 'document') {
        try {
          const authorsQuery = `
            SELECT a.id, a.full_name
            FROM authors a
            JOIN document_authors da ON a.id = da.author_id
            WHERE da.document_id = $1
          `;
          const authorsResult = await client.queryObject(authorsQuery, [doc.id]);
          
          doc.authors = authorsResult.rows.map((author: any) => ({
            id: author.id,
            full_name: author.full_name || '',
          }));
        } catch (error) {
          console.error(`Error fetching authors for document ${doc.id}:`, error);
          doc.authors = [];
        }
        
        // Fetch topics for this document
        try {
          const topicsQuery = `
            SELECT ra.id, ra.name
            FROM research_agenda ra
            JOIN document_research_agenda dra ON ra.id = dra.research_agenda_id
            WHERE dra.document_id = $1
          `;
          const topicsResult = await client.queryObject(topicsQuery, [doc.id]);
          
          doc.topics = topicsResult.rows.map((topic: any) => ({
            id: topic.id,
            name: topic.name || '',
          }));
        } catch (error) {
          console.error(`Error fetching topics for document ${doc.id}:`, error);
          doc.topics = [];
        }
      }
      
      documents.push(doc);
    }
    
    return {
      documents,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return {
      documents: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      error: `Error fetching documents: ${error}`,
    };
  }
}

/**
 * Fetches child documents of a compiled document
 * @param compiledDocId The ID of the compiled document
 * @returns Array of child documents
 */
export async function fetchChildDocuments(compiledDocId: number | string): Promise<ChildDocumentsResponse> {
  try {
    console.log(`Fetching child documents for compiled document ID: ${compiledDocId}`);
    
    // Query to get child documents for a compiled document using compiled_document_items
    const query = `
      SELECT 
        d.id, 
        d.title,
        d.description,
        d.publication_date, 
        d.document_type,
        d.volume,
        d.issue,
        cdi.compiled_document_id as parent_compiled_id
      FROM 
        documents d
      JOIN
        compiled_document_items cdi ON d.id = cdi.document_id
      WHERE 
        cdi.compiled_document_id = $1
      ORDER BY
        d.publication_date DESC, d.id ASC
    `;
    
    console.log(`Executing query: ${query}`);
    console.log(`Query parameters: [${compiledDocId}]`);
    
    const result = await client.queryObject(query, [compiledDocId]);
    console.log(`Query returned ${result.rowCount} rows`);
    
    if (result.rowCount === 0) {
      // If we didn't find any children through the junction table, try the compiled_parent_id field
      const fallbackQuery = `
        SELECT 
          d.id, 
          d.title,
          d.description,
          d.publication_date, 
          d.document_type,
          d.volume,
          d.issue,
          d.compiled_parent_id as parent_compiled_id
        FROM 
          documents d
        WHERE 
          d.compiled_parent_id = $1
        ORDER BY
          d.publication_date DESC, d.id ASC
      `;
      
      console.log(`No children found via junction table. Trying fallback query with compiled_parent_id`);
      const fallbackResult = await client.queryObject(fallbackQuery, [compiledDocId]);
      console.log(`Fallback query returned ${fallbackResult.rowCount} rows`);
      
      if (fallbackResult.rowCount === 0) {
        console.log(`No child documents found for compiled document ID: ${compiledDocId}`);
        return { documents: [] };
      }
      
      // Use the fallback results
      result.rows = fallbackResult.rows;
      result.rowCount = fallbackResult.rowCount;
    }
    
    // Process documents to include authors and topics
    const documents: Document[] = [];
    for (const row of result.rows as any[]) {
      // Convert to Document structure
      const doc: Document = {
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        publication_date: row.publication_date ? new Date(row.publication_date) : null,
        document_type: row.document_type || '',
        volume: row.volume || '',
        issue: row.issue || '',
        authors: [],
        topics: [],
        is_compiled: false,
        parent_compiled_id: parseInt(String(row.parent_compiled_id), 10) || null
      };
      
      // Add doc_type for frontend compatibility
      (doc as any).doc_type = row.document_type || '';
      
      // Fetch authors for this document
      try {
        const authorsQuery = `
          SELECT a.id, a.full_name
          FROM authors a
          JOIN document_authors da ON a.id = da.author_id
          WHERE da.document_id = $1
        `;
        const authorsResult = await client.queryObject(authorsQuery, [doc.id]);
        
        doc.authors = (authorsResult.rows as any[]).map(author => ({
          id: author.id,
          full_name: author.full_name || ''
        }));
      } catch (error) {
        console.error(`Error fetching authors for document ${doc.id}:`, error);
        doc.authors = [];
      }
      
      // Fetch topics for this document
      try {
        const topicsQuery = `
          SELECT ra.id, ra.name
          FROM research_agenda ra
          JOIN document_research_agenda dra ON ra.id = dra.research_agenda_id
          WHERE dra.document_id = $1
        `;
        const topicsResult = await client.queryObject(topicsQuery, [doc.id]);
        
        doc.topics = (topicsResult.rows as any[]).map(topic => ({
          id: topic.id,
          name: topic.name || ''
        }));
      } catch (error) {
        console.error(`Error fetching topics for document ${doc.id}:`, error);
        doc.topics = [];
      }
      
      documents.push(doc);
    }
    
    console.log(`Returning ${documents.length} child documents with details`);
    return { documents };
  } catch (error) {
    console.error(`Error fetching child documents for compiled document ID ${compiledDocId}:`, error);
    return { documents: [] };
  }
}

/**
 * Creates a new compiled document
 * @param compiledDoc The compiled document data
 * @param documentIds Array of document IDs to associate with the compiled document
 * @returns The created compiled document ID
 */
export async function createCompiledDocument(
  compiledDoc: {
    start_year?: number;
    end_year?: number;
    volume?: number;
    issue_number?: number;
    department?: string;
    category?: string;
  },
  documentIds: number[] = []
): Promise<number> {
  try {
    console.log("-------------------------------------------");
    console.log("📊 DATABASE: CREATING COMPILED DOCUMENT");
    console.log("-------------------------------------------");
    console.log(`📚 Category: ${compiledDoc.category || 'N/A'}`);
    console.log(`📚 Volume: ${compiledDoc.volume || 'N/A'}`);
    console.log(`📚 Year Range: ${compiledDoc.start_year || 'N/A'} - ${compiledDoc.end_year || 'N/A'}`);
    console.log(`📚 Document IDs to link: ${documentIds.length > 0 ? documentIds.join(', ') : 'None'}`);
    
    // Insert into compiled_documents table
    const insertQuery = `
      INSERT INTO compiled_documents (
        start_year, end_year, volume, issue_number, department, category
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING id
    `;
    
    const result = await client.queryObject(insertQuery, [
      compiledDoc.start_year || null,
      compiledDoc.end_year || null,
      compiledDoc.volume || null,
      compiledDoc.issue_number || null,
      compiledDoc.department || null,
      compiledDoc.category || null
    ]);
    
    // Safe type handling for the result
    if (!result.rows.length) {
      throw new Error("Failed to create compiled document - no ID returned");
    }
    
    const row = result.rows[0] as Record<string, unknown>;
    if (row.id === undefined) {
      throw new Error("Failed to create compiled document - invalid ID returned");
    }
    
    const compiledDocId = typeof row.id === 'bigint' ? Number(row.id) : Number(row.id);
    
    console.log(`Created compiled document with ID: ${compiledDocId}`);
    console.log(`Successfully inserted into compiled_documents table with ID ${compiledDocId}`);
    
    // Associate document IDs with the compiled document if provided
    if (documentIds.length > 0) {
      console.log(`Adding ${documentIds.length} documents to compilation ${compiledDocId} via junction table`);
      let successCount = 0;
      let failCount = 0;
      
      for (const docId of documentIds) {
        try {
          await addDocumentToCompilation(compiledDocId, docId);
          successCount++;
        } catch (error) {
          console.error(`Failed to link document ${docId} to compilation ${compiledDocId}:`, error);
          failCount++;
        }
      }
      
      console.log("-------------------------------------------");
      console.log("📊 DATABASE: JUNCTION TABLE SUMMARY");
      console.log("-------------------------------------------");
      console.log(`✅ Successfully linked: ${successCount} documents`);
      console.log(`❌ Failed to link: ${failCount} documents`);
      console.log("-------------------------------------------");
    } else {
      console.log("No documents to link - skipping junction table operations");
    }
    
    return compiledDocId;
  } catch (error) {
    console.error("Error creating compiled document:", error);
    throw error;
  }
}

/**
 * Adds a document to a compilation
 * @param compiledDocId The compiled document ID
 * @param documentId The document ID to add
 */
export async function addDocumentToCompilation(compiledDocId: number, documentId: number): Promise<void> {
  try {
    console.log(`Adding document ${documentId} to compilation ${compiledDocId}`);
    
    // Validate IDs
    if (!compiledDocId || !documentId) {
      throw new Error(`Invalid IDs: compiledDocId=${compiledDocId}, documentId=${documentId}`);
    }
    
    // First check if the relationship already exists
    const checkQuery = `
      SELECT id FROM compiled_document_items 
      WHERE compiled_document_id = $1 AND document_id = $2
    `;
    
    const checkResult = await client.queryObject(checkQuery, [compiledDocId, documentId]);
    
    // Skip insertion if relationship already exists
    if (checkResult.rows.length > 0) {
      console.log(`Document ${documentId} is already part of compilation ${compiledDocId}`);
      return;
    }
    
    // Insert the relationship if it doesn't exist
    const insertQuery = `
      INSERT INTO compiled_document_items (compiled_document_id, document_id)
      VALUES ($1, $2)
      RETURNING id
    `;
    
    const result = await client.queryObject(insertQuery, [compiledDocId, documentId]);
    
    // Check if the insertion was successful
    if (result.rows.length > 0) {
      console.log(`Document ${documentId} successfully added to compilation ${compiledDocId}`);
    } else {
      console.warn(`Failed to add document ${documentId} to compilation ${compiledDocId}`);
    }
  } catch (error) {
    console.error(`Error adding document ${documentId} to compilation ${compiledDocId}:`, error);
    throw error;
  }
}

/**
 * Removes a document from a compilation
 * @param compiledDocId The compiled document ID
 * @param documentId The document ID to remove
 */
export async function removeDocumentFromCompilation(compiledDocId: number, documentId: number): Promise<void> {
  try {
    const deleteQuery = `
      DELETE FROM compiled_document_items
      WHERE compiled_document_id = $1 AND document_id = $2
    `;
    
    await client.queryObject(deleteQuery, [compiledDocId, documentId]);
  } catch (error) {
    console.error(`Error removing document ${documentId} from compilation ${compiledDocId}:`, error);
    throw error;
  }
}

/**
 * Fetches a compiled document by ID
 * @param compiledDocId The compiled document ID
 * @returns The compiled document data
 */
export async function getCompiledDocument(compiledDocId: number): Promise<CompiledDocument | null> {
  try {
    const query = `
      SELECT * FROM compiled_documents
      WHERE id = $1
    `;
    
    const result = await client.queryObject(query, [compiledDocId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Convert the row to CompiledDocument type
    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: typeof row.id === 'bigint' ? Number(row.id) : row.id as number,
      start_year: row.start_year as number | undefined,
      end_year: row.end_year as number | undefined,
      volume: row.volume as number | undefined,
      issue_number: row.issue_number as number | undefined,
      department: row.department as string | undefined,
      category: row.category as string | undefined,
      created_at: row.created_at as string
    };
  } catch (error) {
    console.error(`Error fetching compiled document with ID ${compiledDocId}:`, error);
    return null;
  }
}

/**
 * Helper function to get the total count of documents
 * @param whereClause SQL WHERE clause for filtering
 * @param params Query parameters
 * @returns Total count of documents
 */
async function getTotalDocumentCount(whereClause: string, params: any[]): Promise<number> {
  // Count regular documents
  const docsCountQuery = `
    SELECT COUNT(*) 
    FROM documents d
    ${whereClause}
  `;
  const docsCountResult = await client.queryObject(docsCountQuery, params);
  const docsCountRow = docsCountResult.rows[0] as Record<string, unknown>;
  const regularDocsCount = parseInt(String(docsCountRow?.count || '0'), 10);
  
  // Count compiled documents that don't exist in documents table
  const compiledCountQuery = `
    SELECT COUNT(*) 
    FROM compiled_documents cd
    WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = cd.id)
  `;
  const compiledCountResult = await client.queryObject(compiledCountQuery);
  const compiledCountRow = compiledCountResult.rows[0] as Record<string, unknown>;
  const compiledDocsCount = parseInt(String(compiledCountRow?.count || '0'), 10);
  
  // Return total
  return regularDocsCount + compiledDocsCount;
}