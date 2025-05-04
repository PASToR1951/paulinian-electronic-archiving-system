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
    
    // Get query parameters
    const page = parseInt(ctx.request.query.page) || 1;
    const limit = parseInt(ctx.request.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = ctx.request.query.category || "";
    const search = ctx.request.query.search || "";
    const sortOrder = ctx.request.query.sort || "latest"; // 'latest' or 'earliest'
    
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
        GROUP_CONCAT(a.name, ', ') as author
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
    if (category) {
      query += ` AND d.document_type = ?`;
    }
    
    // Add search filter if provided
    if (search) {
      query += ` AND (d.title LIKE ? OR d.abstract LIKE ? OR a.name LIKE ?)`;
    }
    
    // Group by document ID to handle multiple authors
    query += ` GROUP BY d.id`;
    
    // Add sorting
    if (sortOrder === "earliest") {
      query += ` ORDER BY d.publication_date ASC, d.title ASC`;
    } else {
      query += ` ORDER BY d.publication_date DESC, d.title ASC`;
    }
    
    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    
    // Prepare query parameters
    const queryParams = [];
    
    if (category) {
      queryParams.push(category);
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add pagination parameters
    queryParams.push(limit, offset);
    
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
    
    // Add category filter if provided
    if (category) {
      countQuery += ` AND d.document_type = ?`;
    }
    
    // Add search filter if provided
    if (search) {
      countQuery += ` AND (d.title LIKE ? OR d.abstract LIKE ? OR a.name LIKE ?)`;
    }
    
    // Prepare count query parameters
    const countParams = [];
    
    if (category) {
      countParams.push(category);
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Execute count query
    const countResult = await db.query(countQuery, countParams);
    const totalDocuments = countResult[0]?.total || 0;
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
    const categoryCounts = {};
    categoryCountsResult.forEach(row => {
      const category = row.category || 'Uncategorized';
      categoryCounts[category] = row.count;
    });
    
    // Process documents to handle any additional data needs
    const processedDocuments = documents.map(doc => {
      // Parse authors string into array
      let authors = [];
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
    
  } catch (error) {
    console.error('Error fetching archived documents:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived documents',
      details: error.message
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
    
    // Set the deleted_at field to NULL to restore the document
    const query = `
      UPDATE documents
      SET deleted_at = NULL
      WHERE id = ?
    `;
    
    // Execute the query
    const result = await db.query(query, [documentId]);
    
    if (result.affectedRows === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Document not found' };
      return;
    }
    
    ctx.response.body = {
      success: true,
      message: 'Document restored successfully'
    };
    
  } catch (error) {
    console.error('Error restoring document:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to restore document',
      details: error.message
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
    const counts = {};
    result.forEach(row => {
      const category = row.category || 'Uncategorized';
      counts[category] = row.count;
    });
    
    ctx.response.body = {
      counts: counts
    };
    
  } catch (error) {
    console.error('Error fetching archived category counts:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'Failed to fetch archived category counts',
      details: error.message
    };
  }
});

export { router }; 