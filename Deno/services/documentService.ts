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
  start_year?: number;
  end_year?: number;
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
 * Normalize document type to ensure it's a valid enum value
 * @param documentType The document type to normalize
 * @returns A valid uppercase document type enum value
 */
function normalizeDocumentType(documentType: string): string {
  // Convert to uppercase
  const upperType = documentType.toUpperCase();
  
  // Check if it's one of the valid enum values
  const validTypes = ['THESIS', 'DISSERTATION', 'CONFLUENCE', 'SYNERGY'];
  
  if (validTypes.includes(upperType)) {
    return upperType;
  }
  
  // If not valid, map to a suitable default based on context
  console.warn(`Invalid document_type "${documentType}" normalized to default "CONFLUENCE"`);
  return 'CONFLUENCE';
}

/**
 * Fetches documents from the database with filtering, sorting, and pagination
 * Handles both regular and compiled documents in a single query
 */
export async function fetchDocuments(
  options: DocumentOptions = {}
): Promise<DocumentsResponse> {
  try {
    console.log(`[DB] Fetching documents with options: ${JSON.stringify(options)}`);
    
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
      // Use text comparison instead of direct type casting
      categoryDocWhereClause = `AND LOWER((d.document_type)::TEXT) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }
    
    // For category filtering in compiled documents
    let categoryCompWhereClause = '';
    if (category && category !== 'All') {
      // Use text comparison without direct type casting
      categoryCompWhereClause = `AND (LOWER((cd.category)::TEXT) = LOWER($${paramIndex-1}) OR cd.category ILIKE $${paramIndex})`;
      // Only add a new parameter for the LIKE clause
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
        (d.document_type)::TEXT as document_type,
          COALESCE(d.volume, '')::TEXT as volume,
          COALESCE(d.issue, '')::TEXT as issue,
          NULL as start_year,
          NULL as end_year,
          'document'::TEXT as doc_source,
          false as is_parent,
          false as is_compiled,
          d.compiled_parent_id as parent_id,
          (
            SELECT COUNT(*) 
            FROM compiled_document_items cdi 
            WHERE cdi.compiled_document_id = d.id
          )::BIGINT as child_count,
          d.deleted_at
      FROM 
        documents d
      WHERE 
          -- Only include documents without compiled_parent_id for main document list
          d.compiled_parent_id IS NULL
          -- Exclude archived documents
          AND d.deleted_at IS NULL
          ${categoryDocWhereClause}
          ${searchWhereClause}
          
        UNION ALL
        
        -- Compiled documents from the compiled_documents table directly
        SELECT
          cd.id,
          CONCAT(
            COALESCE(cd.category, ''),
            ' Vol. ',
            COALESCE(CAST(cd.volume AS TEXT), ''),
            CASE 
              WHEN cd.start_year IS NOT NULL AND cd.end_year IS NOT NULL THEN CONCAT(' (', cd.start_year, '-', cd.end_year, ')')
              WHEN cd.start_year IS NOT NULL THEN CONCAT(' (', cd.start_year, ')')
              ELSE ''
            END
          )::TEXT as title,
          ''::TEXT as description,
          NULL as publication_date,
          (COALESCE(cd.category, 'CONFLUENCE'))::TEXT as document_type,
          COALESCE(CAST(cd.volume AS TEXT), '')::TEXT as volume,
          COALESCE(CAST(cd.issue_number AS TEXT), '')::TEXT as issue,
          cd.start_year,
          cd.end_year,
          'compiled'::TEXT as doc_source,
          true as is_parent,
          true as is_compiled,
          NULL::BIGINT as parent_id,
          (
            SELECT COUNT(*) 
            FROM compiled_document_items cdi 
            WHERE cdi.compiled_document_id = cd.id
          )::BIGINT as child_count,
          cd.deleted_at
        FROM 
          compiled_documents cd
        WHERE 
          cd.deleted_at IS NULL ${categoryCompWhereClause}
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
    
    console.log(`[DB] Executing combined query with params:`, params);
    // Output full SQL for debugging
    console.log(`[DB] FULL SQL QUERY:\n${query}`);
    
    const result = await client.queryObject(query, params);
    console.log(`[DB] Query returned ${result.rowCount} rows`);
    
    // Check the first few results for deleted_at values
    if (result.rows && result.rows.length > 0) {
      console.log(`[DB] First 3 results from database:`);
      result.rows.slice(0, 3).forEach((row: any, index) => {
        console.log(`[DB] Row ${index}:`, {
          id: row.id, 
          title: row.title?.substring(0, 30) + '...',
          is_compiled: row.is_compiled,
          deleted_at: row.deleted_at,
          deleted_at_type: typeof row.deleted_at
        });
      });
    }
    
    // If no results in the combined query, check if we have compiled documents in the database
    if (result.rowCount === undefined || result.rowCount === 0 || result.rowCount < 5) {
      console.log(`[DB] Few or no results returned (${result.rowCount ?? 0}), checking for compiled documents separately...`);
      
      // Direct query to check if we have compiled documents in the database
      const compiledCheckQuery = `
        SELECT cd.id, cd.category, cd.volume, cd.start_year, cd.end_year, d.deleted_at 
        FROM compiled_documents cd
        LEFT JOIN documents d ON d.id = cd.id 
        LIMIT 10
      `;
      
      const compiledCheck = await client.queryObject(compiledCheckQuery);
      console.log(`[DB] Found ${compiledCheck.rowCount ?? 0} compiled documents in direct check:`, 
        compiledCheck.rows?.map((r: any) => ({ 
          id: r.id, 
          category: r.category, 
          deleted: r.deleted_at ? 'Yes' : 'No' 
        })) || []
      );
    }
    
    if (!result.rowCount) {
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
      console.log(`[DB] Processing ${row.doc_source} row ID=${row.id}:`, {
        deleted_at: row.deleted_at,
        deleted_at_type: typeof row.deleted_at,
        title: row.title?.substring(0, 30)
      });
      
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
        parent_compiled_id: row.parent_id,
        start_year: row.start_year ? parseInt(String(row.start_year), 10) : undefined,
        end_year: row.end_year ? parseInt(String(row.end_year), 10) : undefined
      };
      
      // Also add deleted_at explicitly for use in filtering
      (doc as any).deleted_at = row.deleted_at;
      
      // Log if this document has deleted_at set
      if (row.deleted_at) {
        console.warn(`[DB] WARNING: Document ${doc.id} has deleted_at=${row.deleted_at} but is still included in results!`);
      }
      
      // Add a doc_type property for frontend compatibility
      (doc as any).doc_type = row.document_type || '';
      
      // Skip child documents with no children if we're filtering by category
      if (doc.is_compiled && doc.child_count === 0 && category && category !== 'All') {
        console.log(`[DB] Skipping empty compiled document ${doc.id} (${doc.title}) when filtering by category`);
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
          console.error(`[DB] Error fetching authors for document ${doc.id}:`, error);
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
          console.error(`[DB] Error fetching topics for document ${doc.id}:`, error);
          doc.topics = [];
        }
      }
      
      documents.push(doc);
    }
    
    // Add one final check for deleted documents
    const deletedCount = documents.filter(doc => (doc as any).deleted_at).length;
    if (deletedCount > 0) {
      console.warn(`[DB] WARNING: Found ${deletedCount} documents with deleted_at set in final document array!`);
    }
    
    return {
      documents,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('[DB] Error fetching documents:', error);
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
    
    // First try to get child documents using the compiled_parent_id field (preferred method)
    const primaryQuery = `
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
        AND d.deleted_at IS NULL
      ORDER BY
        d.publication_date DESC, d.id ASC
    `;
    
    console.log(`Executing primary query using compiled_parent_id`);
    const primaryResult = await client.queryObject(primaryQuery, [compiledDocId]);
    console.log(`Primary query returned ${primaryResult.rowCount} rows`);
    
    // If we find documents using the primary method, use them
    if (primaryResult.rowCount && primaryResult.rowCount > 0) {
      console.log(`Found ${primaryResult.rowCount} child documents using compiled_parent_id`);
      
      // Process these results
      const documents = await processChildDocuments(primaryResult.rows as any[]);
      return { documents };
    }
    
    // If no results from primary method, fall back to junction table
    console.log(`No results using compiled_parent_id, falling back to junction table`);
    
    // Query to get child documents for a compiled document using compiled_document_items
    const fallbackQuery = `
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
        AND d.deleted_at IS NULL
      ORDER BY
        d.publication_date DESC, d.id ASC
    `;
    
    console.log(`Executing fallback query using junction table`);
    const fallbackResult = await client.queryObject(fallbackQuery, [compiledDocId]);
    console.log(`Fallback query returned ${fallbackResult.rowCount} rows`);
    
    // Process documents to include authors and topics
    const documents = await processChildDocuments(fallbackResult.rows as any[]);
    return { documents };
  } catch (error) {
    console.error(`Error fetching child documents for compiled document ID ${compiledDocId}:`, error);
    return { documents: [] };
  }
}

/**
 * Helper function to process child document rows into full document objects
 * @param rows Database result rows
 * @returns Array of processed document objects
 */
async function processChildDocuments(rows: any[]): Promise<Document[]> {
  const documents: Document[] = [];
  
  for (const row of rows) {
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
      parent_compiled_id: parseInt(String(row.parent_compiled_id), 10) || null,
      start_year: row.start_year ? parseInt(String(row.start_year), 10) : undefined,
      end_year: row.end_year ? parseInt(String(row.end_year), 10) : undefined
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
  
  return documents;
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
    console.log(`Creating compiled document: ${JSON.stringify(compiledDoc)}`);
    
    // Start a transaction
    await client.queryArray("BEGIN");
    
    try {
      // Generate a title for logging purposes
      const documentTitle = `${compiledDoc.category || 'Compiled Document'} Vol. ${compiledDoc.volume || '1'}${compiledDoc.start_year ? ` (${compiledDoc.start_year})` : ''}`;
      
      // Create the compiled document directly without creating a documents entry
      const compiledQuery = `
        INSERT INTO compiled_documents (
          start_year, 
          end_year, 
          volume, 
          issue_number, 
          department, 
          category,
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      
      const compiledParams = [
        compiledDoc.start_year || null,
        compiledDoc.end_year || null,
        compiledDoc.volume || null,
        compiledDoc.issue_number || null,
        compiledDoc.department || null,
        compiledDoc.category || 'CONFLUENCE'
      ];
      
      const compiledResult = await client.queryObject(compiledQuery, compiledParams);
      
      if (!compiledResult.rows || compiledResult.rows.length === 0) {
        throw new Error("Failed to create compiled document entry");
      }
      
      const row = compiledResult.rows[0] as Record<string, unknown>;
      const compiledDocId = typeof row.id === 'bigint' ? Number(row.id) : Number(row.id);
      
      console.log(`Successfully inserted into compiled_documents table with ID ${compiledDocId}`);
      
      // Associate document IDs with the compiled document if provided
      if (documentIds.length > 0) {
        console.log(`Setting compiled_parent_id for ${documentIds.length} documents to compilation ${compiledDocId}`);
        let successCount = 0;
        let failCount = 0;
        
        for (const docId of documentIds) {
          try {
            // Update the compiled_parent_id in the documents table
            const updateQuery = `
              UPDATE documents 
              SET compiled_parent_id = $1
              WHERE id = $2
            `;
            
            await client.queryObject(updateQuery, [compiledDocId, docId]);
            
            // Also add to the junction table for backward compatibility
            await addDocumentToCompilation(compiledDocId, docId);
            
            successCount++;
          } catch (error) {
            console.error(`Failed to link document ${docId} to compilation ${compiledDocId}:`, error);
            failCount++;
          }
        }
        
        console.log("-------------------------------------------");
        console.log("📊 DATABASE: DOCUMENT LINKING SUMMARY");
        console.log("-------------------------------------------");
        console.log(`✅ Successfully linked: ${successCount} documents`);
        console.log(`❌ Failed to link: ${failCount} documents`);
        console.log("-------------------------------------------");
      } else {
        console.log("No documents to link - skipping parent ID updates");
      }
      
      // Commit the transaction
      await client.queryArray("COMMIT");
      
      return compiledDocId;
    } catch (error) {
      // Rollback in case of any error
      await client.queryArray("ROLLBACK");
      throw error;
    }
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

/**
 * Soft deletes a compiled document by setting deleted_at timestamp
 * @param compiledDocId The compiled document ID to soft delete
 * @returns The ID of the soft deleted document
 */
export async function softDeleteCompiledDocument(compiledDocId: number): Promise<number> {
  try {
    // Begin transaction
    await client.queryObject("BEGIN");
    
    // 1. First check if the document exists in the compiled_documents table
    const checkCompiledQuery = `
      SELECT id, category, volume, start_year, end_year, deleted_at 
      FROM compiled_documents 
      WHERE id = $1
    `;
    
    const compiledResult = await client.queryObject(checkCompiledQuery, [compiledDocId]);
    
    if (compiledResult.rows.length === 0) {
      throw new Error(`Compiled document with ID ${compiledDocId} not found in compiled_documents table`);
    }
    
    const compiledData = compiledResult.rows[0] as any;
    
    if (compiledData.deleted_at) {
      throw new Error(`Compiled document with ID ${compiledDocId} is already archived`);
    }
    
    // Get current timestamp for consistency
    const currentTime = new Date();
    
    // 2. Get all child documents for the compiled document from the junction table
    const childDocsQuery = `
      SELECT document_id
      FROM compiled_document_items
      WHERE compiled_document_id = $1
    `;
    
    const childDocsResult = await client.queryObject(childDocsQuery, [compiledDocId]);
    const childDocs = childDocsResult.rows.map((row: any) => row.document_id);
    
    console.log(`Found ${childDocs.length} child documents for compiled document ${compiledDocId}`);
    
    // 3. Mark all child documents as archived and ensure they reference their parent
    if (childDocs.length > 0) {
      const updateChildrenQuery = `
        UPDATE documents
        SET 
          deleted_at = $1,
          compiled_parent_id = $2
        WHERE id = ANY($3::int[])
      `;
      
      await client.queryObject(updateChildrenQuery, [currentTime, compiledDocId, childDocs]);
      console.log(`Archived ${childDocs.length} child documents and set their parent ID to ${compiledDocId}`);
    }
    
    // 4. Update the compiled document record in compiled_documents table
    const updateCompiledQuery = `
      UPDATE compiled_documents
      SET deleted_at = $1
      WHERE id = $2
    `;
    
    await client.queryObject(updateCompiledQuery, [currentTime, compiledDocId]);
    console.log(`Updated deleted_at in compiled_documents table for ID ${compiledDocId}`);
    
    // 5. Check if there's a corresponding entry in the documents table
    // If there is, update it too
    const checkDocumentQuery = `
      SELECT id
      FROM documents
      WHERE id = $1
    `;
    
    const documentResult = await client.queryObject(checkDocumentQuery, [compiledDocId]);
    
    if (documentResult.rows.length > 0) {
      // Document exists in documents table, update it
      const updateDocumentQuery = `
        UPDATE documents
        SET deleted_at = $1
        WHERE id = $2
      `;
      
      await client.queryObject(updateDocumentQuery, [currentTime, compiledDocId]);
      console.log(`Updated deleted_at in documents table for ID ${compiledDocId}`);
    } else {
      // No entry in documents table, we need to create one to ensure proper archive display
      const insertDocumentQuery = `
        INSERT INTO documents (
          id, title, document_type, deleted_at, is_compiled
        ) VALUES (
          $1, 
          (SELECT COALESCE((SELECT title FROM documents WHERE id = $1), 'Compiled Document ' || $1::text)),
          (SELECT category FROM compiled_documents WHERE id = $1),
          $2,
          true
        )
        ON CONFLICT (id) DO UPDATE
        SET 
          deleted_at = $2,
          is_compiled = true
      `;
      
      await client.queryObject(insertDocumentQuery, [compiledDocId, currentTime]);
      console.log(`Created or updated document entry for compiled document ${compiledDocId}`);
    }
    
    // Commit the transaction
    await client.queryObject("COMMIT");
    
    console.log(`Successfully archived compiled document ${compiledDocId} and ${childDocs.length} child documents`);
    
    return compiledDocId;
  } catch (error) {
    // Roll back transaction on error
    try {
      await client.queryObject("ROLLBACK");
    } catch (rollbackError) {
      console.error(`Error rolling back transaction for compiledDocId ${compiledDocId}:`, rollbackError);
    }
    
    console.error(`Error soft deleting compiled document ${compiledDocId}:`, error);
    throw error;
  }
}