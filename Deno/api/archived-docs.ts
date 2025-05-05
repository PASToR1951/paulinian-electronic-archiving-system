// API route for fetching archived documents

import { Router } from "../deps.ts";
import { Database } from "../db/database.ts";

const router = new Router();

/**
 * @route GET /api/archived-docs
 * @description Fetch archived/deleted documents with pagination and filtering
 * @param {Object} ctx - Koa context
 */
router.get("/api/archived-docs", async (ctx) => {
  try {
    const db = new Database();
    
    // Get query parameters correctly from the URL
    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const category = url.searchParams.get("category") || "";
    const search = url.searchParams.get("search") || "";
    const sortOrder = url.searchParams.get("sort") || "latest"; // 'latest' or 'earliest'
    
    console.log(`Fetching archived documents: page=${page}, limit=${limit}, category=${category}, search=${search}, sortOrder=${sortOrder}`);
    
    // Build the SQL query - only retrieve documents that have a deleted_at value
    let query = `
      SELECT 
        d.id, 
        d.title, 
        d.abstract, 
        d.publication_date, 
        d.document_type, 
        d.deleted_at,
        d.created_at,
        d.is_compiled,
        d.volume,
        string_agg(COALESCE(a.name, ''), ', ') as author
      FROM 
        documents d
      LEFT JOIN 
        document_authors da ON d.id = da.document_id
      LEFT JOIN 
        authors a ON da.author_id = a.id
      WHERE 
        d.deleted_at IS NOT NULL
    `;
    
    // Add category filter if provided
    let paramCounter = 1;
    const queryParams = [];
    
    if (category) {
      query += ` AND d.document_type = $${paramCounter}`;
      queryParams.push(category);
      paramCounter++;
    }
    
    // Add search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (d.title ILIKE $${paramCounter} OR d.abstract ILIKE $${paramCounter+1} OR a.name ILIKE $${paramCounter+2})`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      paramCounter += 3;
    }
    
    // Group by document ID to handle multiple authors
    query += ` GROUP BY d.id`;
    
    // Add sorting
    if (sortOrder === "earliest") {
      query += ` ORDER BY d.publication_date ASC NULLS LAST, d.title ASC`;
    } else {
      query += ` ORDER BY d.publication_date DESC NULLS LAST, d.title ASC`;
    }
    
    // Add pagination - PostgreSQL uses $n parameters
    query += ` LIMIT $${paramCounter} OFFSET $${paramCounter+1}`;
    
    // Add pagination parameters
    queryParams.push(limit, offset);
    
    console.log("Executing query:", query);
    console.log("With parameters:", queryParams);
    
    // Execute the query
    const documents = await db.query(query, queryParams);
    
    // Get total count of documents matching the filter
    let countQuery = `
      SELECT 
        COUNT(DISTINCT d.id) as total
      FROM 
        documents d
      LEFT JOIN 
        document_authors da ON d.id = da.document_id
      LEFT JOIN 
        authors a ON da.author_id = a.id
      WHERE 
        d.deleted_at IS NOT NULL
    `;
    
    // Reset parameter counter
    paramCounter = 1;
    const countParams = [];
    
    // Add category filter if provided
    if (category) {
      countQuery += ` AND d.document_type = $${paramCounter}`;
      countParams.push(category);
      paramCounter++;
    }
    
    // Add search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      countQuery += ` AND (d.title ILIKE $${paramCounter} OR d.abstract ILIKE $${paramCounter+1} OR a.name ILIKE $${paramCounter+2})`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    console.log("Executing count query:", countQuery);
    console.log("With count parameters:", countParams);
    
    // Execute count query
    const countResult = await db.query(countQuery, countParams);
    const totalDocuments = countResult.length > 0 && countResult[0] 
      ? (typeof countResult[0] === 'object' && countResult[0] && 'total' in countResult[0]
        ? Number(countResult[0].total) 
        : 0)
      : 0;
    const totalPages = Math.ceil(totalDocuments / limit);
    
    // Get category counts for filter badges
    const categoriesQuery = `
      SELECT 
        document_type as category, 
        COUNT(*) as count
      FROM 
        documents
      WHERE 
        deleted_at IS NOT NULL
      GROUP BY 
        document_type
    `;
    
    const categoryCountsResult = await db.query(categoriesQuery);
    
    // Format the category counts
    const categoryCounts: Record<string, number> = {};
    categoryCountsResult.forEach((row: any) => {
      const category = (row.category || 'Uncategorized') as string;
      categoryCounts[category] = Number(row.count);
    });
    
    // Process documents to handle any additional data needs
    const processedDocuments = documents.map((doc: any) => {
      // Parse authors string into array
      let authors: string[] = [];
      if (doc.author) {
        authors = doc.author.split(', ').filter(Boolean);
      }
      
      return {
        ...doc,
        authors: authors,
        // Add any other transformations needed
      };
    });
    
    // Return response
    ctx.response.body = {
      documents: processedDocuments,
      total_documents: totalDocuments,
      current_page: page,
      total_pages: totalPages,
      category_counts: categoryCounts,
      limit: limit
    };
    
  } catch (error: unknown) {
    console.error('Error fetching archived documents:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived documents',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

/**
 * @route POST /api/restore-document/:id
 * @description Restore a document from the archive
 * @param {Object} ctx - Koa context
 */
router.post("/api/restore-document/:id", async (ctx) => {
  try {
    const db = new Database();
    const documentId = ctx.params.id;
    
    if (!documentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Document ID is required' };
      return;
    }
    
    console.log(`Restoring document with ID: ${documentId}`);
    
    // Get the document information first
    const getDocumentQuery = `
      SELECT title, document_type, file_path
      FROM documents
      WHERE id = ?
    `;
    
    const documentInfo = await db.query(getDocumentQuery, [documentId]);
    
    if (documentInfo.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Document not found' };
      return;
    }
    
    // Type assertion for document info
    const docInfo = documentInfo[0] as { 
      title: string; 
      document_type: string; 
      file_path: string | null;
    };
    
    const { title, document_type, file_path } = docInfo;
    
    // Check for active documents with the same title and type
    const checkDuplicateQuery = `
      SELECT id 
      FROM documents 
      WHERE title = ? 
      AND document_type = ? 
      AND deleted_at IS NULL
      AND id <> ?
    `;
    
    const duplicates = await db.query(checkDuplicateQuery, [title, document_type, documentId]);
    
    if (duplicates.length > 0) {
      ctx.response.status = 409;
      ctx.response.body = { 
        error: 'Cannot restore document', 
        details: 'An active document with the same title and type already exists.' 
      };
      return;
    }
    
    // Check for duplicates by file path (if file_path exists)
    if (file_path) {
      const checkFilePathQuery = `
        SELECT id 
        FROM documents 
        WHERE file_path = ? 
        AND deleted_at IS NULL
        AND id <> ?
      `;
      
      const filePathDuplicates = await db.query(checkFilePathQuery, [file_path, documentId]);
      
      if (filePathDuplicates.length > 0) {
        ctx.response.status = 409;
        ctx.response.body = { 
          error: 'Cannot restore document', 
          details: 'An active document with the same file already exists.' 
        };
        return;
      }
    }
    
    // Set the deleted_at field to NULL to restore the document
    const updateQuery = `
      UPDATE documents
      SET deleted_at = NULL
      WHERE id = ?
    `;
    
    // Execute the query
    const result = await db.query(updateQuery, [documentId]);
    
    // Check if the update was successful by examining the result
    const updateSuccessful = result && Array.isArray(result) && result.length > 0;
    
    if (!updateSuccessful) {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Document not found or could not be updated' };
      return;
    }
    
    ctx.response.body = {
      success: true,
      message: 'Document restored successfully'
    };
    
  } catch (error: unknown) {
    console.error('Error restoring document:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to restore document',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

/**
 * @route GET /api/archived-category-counts
 * @description Get counts of archived documents by category
 * @param {Object} ctx - Koa context
 */
router.get("/api/archived-category-counts", async (ctx) => {
  try {
    const db = new Database();
    
    const query = `
      SELECT 
        document_type as category, 
        COUNT(*) as count
      FROM 
        documents
      WHERE 
        deleted_at IS NOT NULL
      GROUP BY 
        document_type
    `;
    
    const result = await db.query(query);
    
    // Format the category counts
    const counts: Record<string, number> = {};
    result.forEach((row: any) => {
      const category = (row.category || 'Uncategorized') as string;
      counts[category] = Number(row.count);
    });
    
    ctx.response.body = {
      counts: counts
    };
    
  } catch (error: unknown) {
    console.error('Error fetching archived category counts:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived category counts',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

export { router }; 