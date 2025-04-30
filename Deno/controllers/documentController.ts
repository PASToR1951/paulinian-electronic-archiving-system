import { DocumentModel } from "../models/documentModel.ts";
import type { Response, Request } from "../deps.ts";
import { client } from "../db/denopost_conn.ts";

/**
 * Fetch categories from the database
 */
export async function fetchCategories(): Promise<Response> {
  try {
    const result = await client.queryObject(
      "SELECT id, category_name as name, (SELECT COUNT(*) FROM documents WHERE category_id = categories.id AND deleted_at IS NULL) as count FROM categories ORDER BY category_name"
    );
    
    // Process the data to handle BigInt values before serialization
    const processedRows = result.rows.map(row => {
      // Create a new object with all properties from the original row
      const processed = {...row};
      
      // Convert any BigInt values to regular numbers
      if (typeof processed.count === 'bigint') {
        processed.count = Number(processed.count);
      }
      if (typeof processed.id === 'bigint') {
        processed.id = Number(processed.id);
      }
      
      return processed;
    });
    
    return new Response(JSON.stringify(processedRows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Fetch documents based on query parameters
 */
export async function fetchDocuments(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Extract query parameters
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");
    const sort = searchParams.get("sort") || "latest";
    
    console.log(`Fetching documents with params: category=${category}, page=${page}, size=${size}, sort=${sort}`);
    
    // TODO: Get actual documents from database
    // For now, we'll return mock data
    const mockDocuments = {
      documents: [
        {
          id: 1,
          title: "Sample Document 1",
          abstract: "This is a sample abstract for testing",
          publication_date: "2023-01-01",
          category_name: "Confluence",
          document_type: "CONFLUENCE",
          file_path: "/storage/sample1.pdf",
          authors: [{ id: 1, full_name: "John Doe" }],
          topics: [{ id: 1, name: "Science" }],
          page_count: 10,
          is_public: true,
          created_at: "2023-06-05",
          updated_at: "2023-06-05"
        },
        {
          id: 2,
          title: "Sample Document 2",
          abstract: "Another sample abstract for testing",
          publication_date: "2023-02-15",
          category_name: "Thesis",
          document_type: "THESIS",
          file_path: "/storage/sample2.pdf",
          authors: [{ id: 2, full_name: "Jane Smith" }],
          topics: [{ id: 2, name: "Technology" }],
          page_count: 15,
          is_public: true,
          created_at: "2023-06-10",
          updated_at: "2023-06-10"
        }
      ],
      totalCount: 2,
      totalPages: 1,
      currentPage: page
    };
    
    return new Response(JSON.stringify(mockDocuments), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Get a specific document by ID
 */
export async function getDocumentById(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const document = await DocumentModel.getById(parseInt(documentId));
    
    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify(document), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Create a new document
 */
export async function createDocument(req: Request): Promise<Response> {
  try {
    if (req.body) {
      const body = await req.json();
      
      // Validate required fields
      if (!body.title) {
        return new Response(JSON.stringify({ error: "Title is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Validate document_type against known types
      const validDocumentTypes = ['THESIS', 'DISSERTATION', 'CONFLUENCE', 'SYNERGY', 'RESEARCH_STUDY'];
      if (body.document_type && !validDocumentTypes.includes(body.document_type)) {
        return new Response(JSON.stringify({ 
          error: `Invalid document_type. Must be one of: ${validDocumentTypes.join(', ')}` 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Set appropriate file paths based on document type if not already set
      if (!body.file_path && body.document_type) {
        switch (body.document_type) {
          case 'THESIS':
            body.file_path = 'storage/single/thesis/';
            break;
          case 'DISSERTATION':
            body.file_path = 'storage/single/dissertation/';
            break;
          case 'CONFLUENCE':
            body.file_path = 'storage/compiled/confluence/';
            break;
          case 'SYNERGY':
            body.file_path = 'storage/compiled/synergy/';
            break;
          case 'RESEARCH_STUDY':
            // If it's part of a compiled document, file path will be set elsewhere
            if (body.parent_document_id) {
              // We'll leave it as is since the parent document path is needed first
            } else {
              body.file_path = 'storage/research_studies/';
            }
            break;
        }
      }
      
      // For single documents (THESIS or DISSERTATION), we don't include volume and issue
      if (body.document_type === 'THESIS' || body.document_type === 'DISSERTATION') {
        // Remove volume and issue if they exist
        delete body.volume;
        delete body.issue;
      }

      // For research studies in compiled documents, set appropriate category_id if not already set
      if (body.document_type === 'RESEARCH_STUDY' && body.parent_document_id && !body.category_id) {
        body.category_id = 5; // Default research study category ID
      }
      
      console.log('Creating document with data:', JSON.stringify(body, null, 2));
      const newDocument = await DocumentModel.create(body);
      
      return new Response(JSON.stringify(newDocument), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error creating document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (req.body) {
      const body = await req.json();
      
      // Check if document exists
      const existingDocument = await DocumentModel.getById(parseInt(documentId));
      
      if (!existingDocument) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const updatedDocument = await DocumentModel.update(parseInt(documentId), body);
      
      return new Response(JSON.stringify(updatedDocument), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error updating document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Delete a document (soft delete)
 */
export async function deleteDocument(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Check if document exists
    const existingDocument = await DocumentModel.getById(parseInt(documentId));
    
    if (!existingDocument) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    await DocumentModel.delete(parseInt(documentId));
    
    return new Response(JSON.stringify({ message: "Document deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Get sample documents (used for testing)
 */
export async function getSampleDocuments(ctx: Context) {
  try {
    // This is sample data for testing
    const sampleDocuments = [
      {
        id: 1,
        title: "Sample Research Paper",
        abstract: "This is a sample abstract for a research paper.",
        publication_date: "2023-01-15",
        category_name: "Thesis",
        document_type: "research",
        file_path: "/files/sample1.pdf",
        pages: 10,
        is_public: true,
        created_at: "2023-01-10T08:30:00Z",
        updated_at: "2023-01-10T08:30:00Z",
        authors: [
          { id: 1, full_name: "John Smith" },
          { id: 2, full_name: "Jane Doe" }
        ],
        topics: [
          { id: 1, name: "Artificial Intelligence" },
          { id: 2, name: "Machine Learning" }
        ]
      },
      {
        id: 2,
        title: "Advanced Study on Robotics",
        abstract: "A comprehensive study on modern robotics and its applications.",
        publication_date: "2022-11-20",
        category_name: "Dissertation",
        document_type: "research",
        file_path: "/files/sample2.pdf",
        pages: 15,
        is_public: true,
        created_at: "2022-11-15T14:45:00Z",
        updated_at: "2022-11-15T14:45:00Z",
        authors: [
          { id: 3, full_name: "Robert Johnson" }
        ],
        topics: [
          { id: 3, name: "Robotics" },
          { id: 4, name: "Automation" }
        ]
      }
    ];

    ctx.response.body = { 
      documents: sampleDocuments,
      totalCount: 2,
      totalPages: 1,
      currentPage: 1
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Error fetching sample documents: " + error.message };
  }
}
