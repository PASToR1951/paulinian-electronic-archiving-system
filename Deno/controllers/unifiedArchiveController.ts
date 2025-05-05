import { RouterContext } from "../deps.ts";
import { client } from "../db/denopost_conn.ts";
import { DocumentModel } from "../models/documentModel.ts";

// Define type for params to use with RouterContext
type RouteParams = {
  id?: string;
  [key: string]: string | undefined;
};

/**
 * Helper function to convert BigInt values to numbers in objects
 * This resolves the JSON serialization issue with BigInt values
 * @param {any} data - The data to convert
 * @returns {any} - The converted data
 */
function convertBigIntToNumber(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    // Convert BigInt to regular number or string if it's too large
    return Number(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(convertBigIntToNumber);
  }
  
  if (typeof data === 'object') {
    // Check if it's a Date object
    if (data instanceof Date) {
      return data.toISOString();
    }
    
    const result: Record<string, any> = {};
    for (const key in data) {
      // Special handling for date fields
      if (
        (key.toLowerCase().includes('date') || key === 'deleted_at' || key === 'created_at') && 
        data[key] !== null && 
        typeof data[key] === 'object'
      ) {
        // If it's a Date object
        if (data[key] instanceof Date) {
          result[key] = data[key].toISOString();
        } 
        // If it's a PostgreSQL date object with year/month/day properties
        else if (data[key].year !== undefined && data[key].month !== undefined && data[key].day !== undefined) {
          try {
            const year = parseInt(String(data[key].year));
            const month = parseInt(String(data[key].month)) - 1; // JS months are 0-indexed
            const day = parseInt(String(data[key].day));
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              result[key] = date.toISOString();
            } else {
              result[key] = data[key];
            }
          } catch (e) {
            console.warn(`Error converting date field ${key}:`, e);
            result[key] = data[key];
          }
        }
        // Empty object case
        else if (Object.keys(data[key]).length === 0) {
          // For empty objects, use a placeholder date string instead of null
          if (key === 'publication_date') {
            result[key] = 'Unknown';
          } else {
            // For other date fields like deleted_at, use current date
            result[key] = new Date().toISOString();
          }
        }
        else {
          result[key] = convertBigIntToNumber(data[key]);
        }
      } else {
        result[key] = convertBigIntToNumber(data[key]);
      }
    }
    return result;
  }
  
  return data;
}

/**
 * Unified Archive Controller
 * Handles all archive-related operations for both regular and compiled documents
 */

/**
 * Get all archived documents with pagination and filtering
 * Unified endpoint that handles both regular and compiled documents
 */
export async function getAllArchivedDocuments(ctx: any) {
  try {
    // Get query parameters from the URL
    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "10");
    const type = url.searchParams.get("type") || "";
    const search = url.searchParams.get("search") || "";
    const compiledOnly = url.searchParams.get("compiled_only") === "true";
    
    console.log(`[UNIFIED ARCHIVE] Getting archived documents: page=${page}, size=${size}, type=${type}, search=${search}, compiledOnly=${compiledOnly}`);
    
    // Calculate offset based on page and size
    const offset = (page - 1) * size;
    
    // Query params for prepared statement
    const params: any[] = [];
    let paramIndex = 1;
    
    // Create a unified query that gets both regular documents and compiled documents
    let baseQuery = `
      WITH archived_documents AS (
        -- Regular documents from documents table
        SELECT 
          d.id, 
          d.title, 
          d.abstract, 
          d.publication_date, 
          to_char(d.publication_date, 'YYYY-MM-DD') as publication_date_formatted,
          (d.document_type)::TEXT as document_type, 
          d.deleted_at,
          to_char(d.deleted_at, 'YYYY-MM-DD') as deleted_at_formatted,
          d.created_at,
          d.compiled_parent_id as parent_document_id,
          (
            SELECT COUNT(*) 
            FROM compiled_document_items cdi
            WHERE cdi.compiled_document_id = d.id
          ) as child_count,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM compiled_document_items cdi 
              WHERE cdi.compiled_document_id = d.id
            ) THEN true
            ELSE false
          END as is_compilation,
          d.volume,
          'documents' as source_table,
          false as is_compiled,
          NULL as start_year,
          NULL as end_year
        FROM 
          documents d
        WHERE 
          d.deleted_at IS NOT NULL
        
        UNION ALL
        
        -- Compiled documents from compiled_documents table
        SELECT 
          cd.id,
          CONCAT(
            COALESCE(cd.category, ''),
            ' Vol. ',
            COALESCE(CAST(cd.volume AS TEXT), ''),
            CASE 
              WHEN cd.start_year IS NOT NULL AND cd.end_year IS NOT NULL THEN CONCAT(' (', cd.start_year, '-', cd.end_year, ')')\
              WHEN cd.start_year IS NOT NULL THEN CONCAT(' (', cd.start_year, ')')
              ELSE ''
            END
          ) as title,
          NULL as abstract,
          NULL as publication_date,
          NULL as publication_date_formatted,
          (cd.category)::TEXT as document_type,
          cd.deleted_at,
          to_char(cd.deleted_at, 'YYYY-MM-DD') as deleted_at_formatted,
          cd.created_at,
          NULL as parent_document_id,
          (
            SELECT COUNT(*) 
            FROM compiled_document_items cdi
            WHERE cdi.compiled_document_id = cd.id
          ) as child_count,
          true as is_compilation,
          CAST(cd.volume AS TEXT) as volume,
          'compiled_documents' as source_table,
          true as is_compiled,
          cd.start_year,
          cd.end_year
        FROM 
          compiled_documents cd
        WHERE 
          cd.deleted_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = cd.id AND d.deleted_at IS NOT NULL
          )
      )
      
      SELECT 
        ad.*,
        CASE 
          WHEN ad.source_table = 'documents' THEN (
            SELECT string_agg(DISTINCT a.full_name, ', ') 
            FROM document_authors da 
            JOIN authors a ON da.author_id = a.id 
            WHERE da.document_id = ad.id
          )
          ELSE NULL
        END as authors
      FROM 
        archived_documents ad
      WHERE 1=1
    `;
    
    // Add type filter if provided
    if (type) {
      baseQuery += ` AND ad.document_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    // Add compiled-only filter if requested
    if (compiledOnly) {
      baseQuery += ` AND (ad.is_compilation = true OR ad.parent_document_id IS NOT NULL)`;
    }
    
    // Add search filter if provided
    if (search) {
      baseQuery += ` AND (
        ad.title ILIKE $${paramIndex} OR 
        COALESCE(ad.abstract, '') ILIKE $${paramIndex}
      )`;
      
      const searchPattern = `%${search}%`;
      params.push(searchPattern);
      paramIndex++;
    }
    
    // Count total documents matching the criteria
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_docs`;
    const countResult = await client.queryObject(countQuery, params);
    const totalCount = parseInt((countResult.rows[0] as any).total || "0");
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / size);
    
    // Add pagination to base query
    const finalQuery = `${baseQuery} ORDER BY deleted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(size, offset);
    
    // Execute the paginated query
    const result = await client.queryObject(finalQuery, params);
    const documents = result.rows;
    
    console.log(`[UNIFIED ARCHIVE] Found ${documents.length} archived documents (${totalCount} total)`);
    
    // Get category counts for filter UI
    const categoryCounts = await getArchivedCategoryCounts();
    
    // Convert BigInt values to regular numbers before response
    const responseData = {
      documents: convertBigIntToNumber(documents),
      total_documents: totalCount,
      current_page: page,
      total_pages: totalPages,
      limit: size,
      category_counts: convertBigIntToNumber(categoryCounts)
    };
    
    // Set response
    ctx.response.status = 200;
    ctx.response.body = responseData;
    
  } catch (error) {
    console.error('[UNIFIED ARCHIVE] Error getting archived documents:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived documents',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get a specific archived document by ID
 * Handles both regular and compiled documents
 */
export async function getArchivedDocumentById(ctx: any) {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    console.log(`[UNIFIED ARCHIVE] Getting archived document: id=${id}`);
    
    // Try to fetch document
    const query = `
      SELECT 
        d.*,
        string_agg(DISTINCT a.full_name, ', ') as authors
      FROM 
        documents d
      LEFT JOIN 
        document_authors da ON d.id = da.document_id
      LEFT JOIN 
        authors a ON da.author_id = a.id
      WHERE 
        d.id = $1 
        AND d.deleted_at IS NOT NULL
      GROUP BY d.id
    `;
    
    const result = await client.queryObject(query, [id]);
    
    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Archived document not found" };
      return;
    }
    
    const document = result.rows[0];
    
    // If this is a compiled document, get child documents
    if ((document as any).compiled_parent_id) {
      const childQuery = `
        SELECT 
          d.*,
          string_agg(DISTINCT a.full_name, ', ') as authors
        FROM 
          documents d
        LEFT JOIN 
          document_authors da ON d.id = da.document_id
        LEFT JOIN 
          authors a ON da.author_id = a.id
        JOIN 
          compiled_document_items cdi ON cdi.document_id = d.id
        WHERE 
          cdi.compiled_document_id = $1
          AND d.deleted_at IS NOT NULL
        GROUP BY d.id
      `;
      
      const childResult = await client.queryObject(childQuery, [id]);
      (document as any).child_documents = childResult.rows;
      (document as any).child_count = childResult.rows.length;
    }
    
    ctx.response.status = 200;
    ctx.response.body = convertBigIntToNumber(document);
    
  } catch (error) {
    console.error('[UNIFIED ARCHIVE] Error getting archived document:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived document',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Archive a document (and its children if it's a compiled document)
 */
export async function archiveDocument(ctx: any) {
  try {
    // Get document ID from either URL param or request body
    let documentId;
    let archiveChildren = true; // Default to true
    let isCompiled = false;
    
    // Check if ID is in the URL parameters (for /api/archives/compiled/:id endpoint)
    if (ctx.params && ctx.params.id) {
      documentId = ctx.params.id;
      console.log(`[UNIFIED ARCHIVE] Archiving document from URL params: id=${documentId}`);
      isCompiled = true; // Assume it's a compiled document when using this route
    } else {
      // Parse request body (for /api/archives endpoint)
      const bodyParser = await ctx.request.body({ type: "json" });
      const body = await bodyParser.value;
      
      documentId = body.document_id;
      archiveChildren = body.archive_children !== false; // Default to true
      isCompiled = body.is_compiled === true;
    }
    
    if (!documentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    console.log(`[UNIFIED ARCHIVE] Archiving document: id=${documentId}, archiveChildren=${archiveChildren}, isCompiled=${isCompiled}`);
    
    // Handle compiled documents specially if isCompiled flag is set
    if (isCompiled) {
      return await archiveCompiledDocument(ctx, documentId, archiveChildren);
    }
    
    // First check if document exists and isn't already archived
    const checkQuery = `SELECT id, compiled_parent_id, deleted_at FROM documents WHERE id = $1`;
    const checkResult = await client.queryObject(checkQuery, [documentId]);
    
    if (checkResult.rows.length === 0) {
      // If not found in documents, try compiled_documents table
      const checkCompiledQuery = `SELECT id, deleted_at FROM compiled_documents WHERE id = $1`;
      const checkCompiledResult = await client.queryObject(checkCompiledQuery, [documentId]);
      
      if (checkCompiledResult.rows.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Document not found" };
        return;
      }
      
      // It's a compiled document but not in documents table
      return await archiveCompiledDocument(ctx, documentId, archiveChildren);
    }
    
    const document = checkResult.rows[0] as any;
    
    if (document.deleted_at) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document is already archived" };
      return;
    }
    
    // Begin transaction
    await client.queryObject("BEGIN");
    
    try {
      // Archive the main document
      const now = new Date();
      const archiveQuery = `
        UPDATE documents 
        SET deleted_at = $1
        WHERE id = $2
        RETURNING *
      `;
      
      const archiveResult = await client.queryObject(archiveQuery, [now, documentId]);
      const archivedDocument = archiveResult.rows[0];
      
      // If it's a compiled document and we need to archive children
      let childDocuments: any[] = [];
      if (document.compiled_parent_id && archiveChildren) {
        // Get all child documents
        const childrenQuery = `
          SELECT d.id
          FROM documents d
          JOIN compiled_document_items cdi ON cdi.document_id = d.id
          WHERE cdi.compiled_document_id = $1 AND d.deleted_at IS NULL
        `;
        
        const childrenResult = await client.queryObject(childrenQuery, [documentId]);
        const childIds = childrenResult.rows.map((row: any) => row.id);
        
        if (childIds.length > 0) {
          // Archive all child documents
          const archiveChildrenQuery = `
            UPDATE documents
            SET deleted_at = $1
            WHERE id = ANY($2::int[])
            RETURNING *
          `;
          
          const archiveChildrenResult = await client.queryObject(
            archiveChildrenQuery, 
            [now, childIds]
          );
          
          childDocuments = archiveChildrenResult.rows;
          console.log(`[UNIFIED ARCHIVE] Archived ${childDocuments.length} child documents`);
        }
      }
      
      // Also update the compiled_documents table if this is a compiled document
      if (document.compiled_parent_id) {
        const updateCompiledQuery = `
          UPDATE compiled_documents
          SET deleted_at = $1
          WHERE id = $2
        `;
        
        await client.queryObject(updateCompiledQuery, [now, documentId]);
      }
      
      // Commit transaction
      await client.queryObject("COMMIT");
      
      ctx.response.status = 200;
      ctx.response.body = convertBigIntToNumber({
        message: "Document archived successfully",
        document_id: documentId,
        is_compilation: document.compiled_parent_id ? true : false,
        archived_at: now,
        child_count: childDocuments.length,
        child_documents: childDocuments.map(doc => doc.id)
      });
      
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      throw error;
    }
    
  } catch (error) {
    console.error('[UNIFIED ARCHIVE] Error archiving document:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to archive document',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Archive a compiled document by ID
 * Special handler for compiled documents that need to be archived
 */
async function archiveCompiledDocument(ctx: any, compiledDocId: number, archiveChildren: boolean = true) {
  try {
    console.log(`[UNIFIED ARCHIVE] Archiving compiled document: id=${compiledDocId}`);
    
    // Begin transaction
    await client.queryObject("BEGIN");
    
    try {
      // First check if the document exists in the compiled_documents table
      const checkCompiledQuery = `
        SELECT id, deleted_at 
        FROM compiled_documents 
        WHERE id = $1
      `;
      
      const compiledResult = await client.queryObject(checkCompiledQuery, [compiledDocId]);
      
      if (compiledResult.rows.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Compiled document not found" };
        await client.queryObject("ROLLBACK");
        return;
      }
      
      const compiledDoc = compiledResult.rows[0] as any;
      
      if (compiledDoc.deleted_at) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Compiled document is already archived" };
        await client.queryObject("ROLLBACK");
        return;
      }
      
      // Set deletion timestamp
      const now = new Date();
      
      // Archive the main compiled document in the compiled_documents table
      const archiveCompiledQuery = `
        UPDATE compiled_documents
        SET deleted_at = $1
        WHERE id = $2
        RETURNING *
      `;
      
      await client.queryObject(archiveCompiledQuery, [now, compiledDocId]);
      
      // Check if the document also exists in the documents table
      const checkDocumentQuery = `SELECT id FROM documents WHERE id = $1`;
      const documentResult = await client.queryObject(checkDocumentQuery, [compiledDocId]);
      
      // Archive the main document in the documents table if it exists
      if (documentResult.rows.length > 0) {
        const archiveDocumentQuery = `
          UPDATE documents
          SET deleted_at = $1
          WHERE id = $2
        `;
        
        await client.queryObject(archiveDocumentQuery, [now, compiledDocId]);
      }
      
      // Get child documents
      let childDocuments: any[] = [];
      if (archiveChildren) {
        // Get all child documents from the junction table
        const childrenQuery = `
          SELECT document_id 
          FROM compiled_document_items 
          WHERE compiled_document_id = $1
        `;
        
        const childrenResult = await client.queryObject(childrenQuery, [compiledDocId]);
        const childIds = childrenResult.rows.map((row: any) => row.document_id);
        
        if (childIds.length > 0) {
          // Archive all child documents
          const archiveChildrenQuery = `
            UPDATE documents
            SET deleted_at = $1
            WHERE id = ANY($2::int[])
            RETURNING *
          `;
          
          const archiveChildrenResult = await client.queryObject(
            archiveChildrenQuery, 
            [now, childIds]
          );
          
          childDocuments = archiveChildrenResult.rows;
          console.log(`[UNIFIED ARCHIVE] Archived ${childDocuments.length} child documents of compiled document ${compiledDocId}`);
        }
      }
      
      // Commit transaction
      await client.queryObject("COMMIT");
      
      ctx.response.status = 200;
      ctx.response.body = convertBigIntToNumber({
        message: "Compiled document archived successfully",
        document_id: compiledDocId,
        is_compilation: true,
        archived_at: now,
        child_count: childDocuments.length,
        child_documents: childDocuments.map(doc => doc.id)
      });
      
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error('[UNIFIED ARCHIVE] Error archiving compiled document:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to archive compiled document',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Restore a document from archive
 */
export async function restoreDocument(ctx: any) {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    console.log(`[UNIFIED ARCHIVE] Attempting to restore document/compilation: id=${id}`);
    
    // Begin transaction
    await client.queryObject("BEGIN");
    
    try {
      let isCompiledOnly = false;
      let documentTitle = '';
      let documentType = '';
      let hasDuplicates = false;
      
      // First check if document exists in documents table
      const checkQuery = `SELECT id, title, document_type, compiled_parent_id, deleted_at FROM documents WHERE id = $1`;
      const checkResult = await client.queryObject(checkQuery, [id]);
      
      // If not found in documents table, check compiled_documents table
      if (checkResult.rows.length === 0) {
        console.log(`[UNIFIED ARCHIVE] Document ${id} not found in documents table, checking compiled_documents table`);
        
        const checkCompiledQuery = `
          SELECT id, category as document_type, volume, start_year, end_year, deleted_at 
          FROM compiled_documents 
          WHERE id = $1
        `;
        
        const compiledResult = await client.queryObject(checkCompiledQuery, [id]);
        
        if (compiledResult.rows.length === 0) {
          // Not found in either table
          ctx.response.status = 404;
          ctx.response.body = { error: "Document not found in any table" };
          await client.queryObject("ROLLBACK");
          return;
        }
        
        const compiledDoc = compiledResult.rows[0] as any;
        
        if (!compiledDoc.deleted_at) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Compiled document is not archived" };
          await client.queryObject("ROLLBACK");
          return;
        }
        
        // Generate a title for the compiled document for duplication check
        documentTitle = `${compiledDoc.document_type || 'Compilation'} Vol. ${compiledDoc.volume || ''}`;
        documentType = compiledDoc.document_type || 'COMPILATION';
        isCompiledOnly = true;
        
        // Restore the compiled document
        const restoreCompiledQuery = `
          UPDATE compiled_documents
          SET deleted_at = NULL
          WHERE id = $1
          RETURNING *
        `;
        
        await client.queryObject(restoreCompiledQuery, [id]);
        console.log(`[UNIFIED ARCHIVE] Restored compiled document ${id} from compiled_documents table`);
        
        // Also restore any child documents linked to this compilation
        const childQuery = `
          SELECT document_id
          FROM compiled_document_items
          WHERE compiled_document_id = $1
        `;
        
        const childResult = await client.queryObject(childQuery, [id]);
        const childIds = childResult.rows.map((row: any) => row.document_id);
        
        if (childIds.length > 0) {
          // Restore all child documents that are archived
          const restoreChildrenQuery = `
            UPDATE documents
            SET deleted_at = NULL
            WHERE id = ANY($1::int[])
            AND deleted_at IS NOT NULL
            RETURNING id
          `;
          
          const restoreChildrenResult = await client.queryObject(restoreChildrenQuery, [childIds]);
          const restoredChildCount = restoreChildrenResult.rowCount || 0;
          console.log(`[UNIFIED ARCHIVE] Restored ${restoredChildCount} child documents for compiled document ${id}`);
        }
      } else {
        // Found in documents table
        const document = checkResult.rows[0] as any;
        
        if (!document.deleted_at) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Document is not archived" };
          await client.queryObject("ROLLBACK");
          return;
        }
        
        documentTitle = document.title;
        documentType = document.document_type;
        
        // Check for active documents with the same title and type
        const checkDuplicateQuery = `
          SELECT id 
          FROM documents 
          WHERE title = $1 
          AND document_type = $2 
          AND deleted_at IS NULL
          AND id <> $3
        `;
        
        const duplicateResult = await client.queryObject(
          checkDuplicateQuery, 
          [document.title, document.document_type, id]
        );
        
        if (duplicateResult.rows.length > 0) {
          hasDuplicates = true;
        }
        
        // Restore the document from documents table if no duplicates
        if (!hasDuplicates) {
          const restoreQuery = `
            UPDATE documents 
            SET deleted_at = NULL
            WHERE id = $1
            RETURNING *
          `;
          
          await client.queryObject(restoreQuery, [id]);
          console.log(`[UNIFIED ARCHIVE] Restored document ${id} from documents table`);
          
          // If this is a compiled document, also update the compiled_documents table
          if (document.compiled_parent_id) {
            const updateCompiledQuery = `
              UPDATE compiled_documents
              SET deleted_at = NULL
              WHERE id = $1
            `;
            
            await client.queryObject(updateCompiledQuery, [id]);
            console.log(`[UNIFIED ARCHIVE] Also restored compiled document ${id} reference`);
          }
        }
      }
      
      // Check for duplicates for compiled-only documents
      if (isCompiledOnly && !hasDuplicates) {
        const checkCompiledDuplicateQuery = `
          SELECT id 
          FROM compiled_documents 
          WHERE category = $1
          AND volume = $2
          AND deleted_at IS NULL
          AND id <> $3
        `;
        
        const compiledDuplicateResult = await client.queryObject(
          checkCompiledDuplicateQuery, 
          [documentType, id, id]
        );
        
        if (compiledDuplicateResult.rows.length > 0) {
          hasDuplicates = true;
        }
      }
      
      // Handle duplicates
      if (hasDuplicates) {
        ctx.response.status = 409;
        ctx.response.body = { 
          error: 'Cannot restore document', 
          details: 'An active document with the same title and type already exists.' 
        };
        await client.queryObject("ROLLBACK");
        return;
      }
      
      // Commit transaction
      await client.queryObject("COMMIT");
      
      ctx.response.status = 200;
      ctx.response.body = convertBigIntToNumber({
        message: "Document restored successfully",
        document_id: id,
        is_compilation: isCompiledOnly
      });
      
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      throw error;
    }
    
  } catch (error) {
    console.error('[UNIFIED ARCHIVE] Error restoring document:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to restore document',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get archived child documents of a compiled document
 */
export async function getArchivedChildDocuments(ctx: any) {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    console.log(`[UNIFIED ARCHIVE] Getting archived child documents for compiled document: id=${id}`);
    
    // First check if the parent document exists and is a compiled document
    const checkParentQuery = `
      SELECT id, compiled_parent_id 
      FROM documents 
      WHERE id = $1
    `;
    
    const parentResult = await client.queryObject(checkParentQuery, [id]);
    
    if (parentResult.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Compiled document not found" };
      return;
    }
    
    const parentDoc = parentResult.rows[0] as any;
    
    if (!parentDoc.compiled_parent_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Specified document is not a compiled document" };
      return;
    }
    
    // Get all archived child documents
    const childQuery = `
      SELECT 
        d.*,
        string_agg(DISTINCT a.full_name, ', ') as authors
      FROM 
        documents d
      LEFT JOIN 
        document_authors da ON d.id = da.document_id
      LEFT JOIN 
        authors a ON da.author_id = a.id
      JOIN 
        compiled_document_items cdi ON cdi.document_id = d.id
      WHERE 
        cdi.compiled_document_id = $1
        AND d.deleted_at IS NOT NULL
      GROUP BY d.id
      ORDER BY d.title
    `;
    
    const childResult = await client.queryObject(childQuery, [id]);
    const childDocuments = childResult.rows;
    
    ctx.response.status = 200;
    ctx.response.body = convertBigIntToNumber({
      compiled_document_id: id,
      documents: childDocuments,
      count: childDocuments.length
    });
    
  } catch (error) {
    console.error('[UNIFIED ARCHIVE] Error getting archived child documents:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived child documents',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get counts of archived documents by category
 */
async function getArchivedCategoryCounts() {
  try {
    const query = `
      WITH category_counts AS (
        -- Counts from documents table
        SELECT 
          (document_type)::TEXT as category, 
          COUNT(*) as count
        FROM 
          documents
        WHERE 
          deleted_at IS NOT NULL
        GROUP BY 
          document_type
        
        UNION ALL
        
        -- Counts from compiled_documents table where no matching record in documents
        SELECT 
          (category)::TEXT,
          COUNT(*) as count
        FROM 
          compiled_documents
        WHERE 
          deleted_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = compiled_documents.id AND d.deleted_at IS NOT NULL
          )
        GROUP BY 
          category
      )
      
      -- Combine counts by category
      SELECT 
        category,
        SUM(count) as count
      FROM 
        category_counts
      GROUP BY 
        category
      ORDER BY 
        category
    `;
    
    const result = await client.queryObject(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting archived category counts:', error);
    return [];
  }
} 