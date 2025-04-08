import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { serveFile } from "https://deno.land/std@0.218.2/http/file_server.ts";
import { handleLoginRequest } from "./routes/login.ts";
import { handleLogout } from "./routes/logout.ts";
import { handleSidebar } from "./routes/side_bar.ts";
import { client } from "./data/denopost_conn.ts";
import { handleDocumentSubmission } from "./routes/document_handler.ts";
import { searchAuthors } from "./controllers/author-Controller.ts";
import { searchTopics, createTopic } from "./controllers/topic-Controller.ts";
import { fetchCategories, fetchDocuments } from "./controllers/document-Controller.ts";
import { checkAuth } from "./middleware/auth_middleware.ts";
import { 
  handleGetAuthors, 
  handleGetAuthorById, 
  handleGetDocumentsByAuthor,
  handleCreateAuthor,
  handleUpdateAuthor,
  handleDeleteAuthor
} from "./routes/authors.ts";

const env = await load({ envPath: "./.env" });
console.log("Loaded Environment Variables:", env);

const PORT = 8000;

// List of protected routes that require authentication
const protectedRoutes = [
    "/admin/dashboard.html",
    "/admin/documents.html",
    "/admin/settings.html",
    "/admin/upload_doc.html",
    "/admin/upload-receipt.html",
    "/admin/create-news-article.html",
    "/admin/admin_logs.html",
    "/admin/add_author.html",
    "/admin/document-permission.html",
    "/admin/Components/side_bar.html",
    "/admin/Components/navbar_header.html",
    "/admin/Components/page_header.html"
];

// Add these interfaces at the top of the file with the other imports
interface CategoryRow {
    category_name: string;
    file_count: bigint;
}

interface DocumentRow {
    id: bigint;
    title: string;
    publication_date: string | null;
    file: string;
    category_name: string | null;
    author_names: string[];
}

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    console.log(`Request: ${method} ${path}`);

    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "http://localhost:3003",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cache-Control",
        "Access-Control-Allow-Credentials": "true"
    };

    // Handle CORS preflight requests
    if (method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // Add CORS headers to all responses
    const addCorsHeaders = (response: Response): Response => {
        const headers = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            headers.set(key, value);
        });
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };

    // Handle login and logout routes
    if (path === "/login" && method === "POST") {
        return handleLoginRequest(req);
    }
    if (path === "/logout" && method === "GET") {
        return handleLogout(req);
    }
    if (path === "/sidebar" && method === "GET") {
        return handleSidebar(req);
    }

    // Check if the requested path is a protected route
    if (protectedRoutes.includes(path)) {
        const isAuthenticated = await checkAuth(req);
        if (!isAuthenticated) {
            // Redirect to index if not authenticated
            return new Response(null, {
                status: 302,
                headers: {
                    "Location": "/index.html",
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            });
        }
    }

    // Handle API routes
    if (path.startsWith("/api/")) {
        // Authors API
        if (path === "/api/authors") {
            if (method === "GET") {
                return addCorsHeaders(await searchAuthors(req));
            } else if (method === "POST") {
                return addCorsHeaders(await handleCreateAuthor(req));
            }
        }
        
        const authorIdMatch = path.match(/^\/api\/authors\/([a-f0-9-]+)$/i);
        if (authorIdMatch) {
            const authorId = authorIdMatch[1];
            if (method === "GET") {
                return addCorsHeaders(await handleGetAuthorById(authorId));
            } else if (method === "PUT") {
                return addCorsHeaders(await handleUpdateAuthor(authorId, req));
            } else if (method === "DELETE") {
                return addCorsHeaders(await handleDeleteAuthor(authorId));
            }
        }
        
        const authorDocumentsMatch = path.match(/^\/api\/authors\/(\d+)\/documents$/);
        if (authorDocumentsMatch && method === "GET") {
            const authorId = parseInt(authorDocumentsMatch[1]);
            return addCorsHeaders(await handleGetDocumentsByAuthor(authorId));
        }

        // Handle document submission
        if (path === "/api/submit-document" && method === "POST") {
            return await handleDocumentSubmission(req);
        }

        // Handle document routes
        if (path.startsWith("/api/documents")) {
            if (method === "GET") {
                if (path === "/api/documents") {
                    // List documents
                    return await fetchDocuments(req);
                } else {
                    // Get single document
                    const id = path.split("/").pop();
                    if (!id) {
                        return new Response(JSON.stringify({ message: "Document ID is required" }), {
                            status: 400,
                            headers: { "Content-Type": "application/json" }
                        });
                    }
                    try {
                        const result = await client.queryObject(`
                            SELECT 
                                d.id,
                                d.title,
                                d.publication_date,
                                d.file,
                                d.volume,
                                d.abstract,
                                c.category_name,
                                COALESCE(array_agg(DISTINCT a.full_name) FILTER (WHERE a.full_name IS NOT NULL), ARRAY[]::text[]) as author_names,
                                COALESCE(
                                    json_agg(
                                        DISTINCT jsonb_build_object(
                                            'topic_name', t.topic_name,
                                            'topic_id', t.id
                                        )
                                    ) FILTER (WHERE t.topic_name IS NOT NULL),
                                    '[]'::json
                                ) as topics
                            FROM documents d
                            LEFT JOIN categories c ON d.category_id = c.id
                            LEFT JOIN document_authors da ON d.id = da.document_id
                            LEFT JOIN authors a ON da.author_id = a.author_id
                            LEFT JOIN document_topics dt ON d.id = dt.document_id
                            LEFT JOIN topics t ON dt.topic_id = t.id
                            WHERE d.id = $1
                            GROUP BY d.id, d.title, d.publication_date, d.file, d.volume, d.abstract, c.category_name`,
                            [parseInt(id)]
                        );

                        if (result.rows.length === 0) {
                            return new Response(JSON.stringify({ message: "Document not found" }), {
                                status: 404,
                                headers: { "Content-Type": "application/json" }
                            });
                        }

                        return new Response(JSON.stringify(result.rows[0]), {
                            headers: { "Content-Type": "application/json" }
                        });
                    } catch (error) {
                        console.error("Error fetching document:", error);
                        return new Response(JSON.stringify({ 
                            message: "Error fetching document",
                            error: error instanceof Error ? error.message : String(error)
                        }), {
                            status: 500,
                            headers: { "Content-Type": "application/json" }
                        });
                    }
                }
            } else if (method === "DELETE") {
                const id = path.split("/").pop();
                if (!id) {
                    return new Response(JSON.stringify({ message: "Document ID is required" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" }
                    });
                }
                
                try {
                    // Begin transaction
                    await client.queryObject("BEGIN");
                    
                    try {
                        const documentId = parseInt(id);
                        
                        // First, delete related records in document_authors
                        await client.queryObject(
                            "DELETE FROM document_authors WHERE document_id = $1",
                            [documentId]
                        );
                        
                        // Delete related records in document_topics
                        await client.queryObject(
                            "DELETE FROM document_topics WHERE document_id = $1",
                            [documentId]
                        );
                        
                        // Delete related records in saved_documents
                        await client.queryObject(
                            "DELETE FROM saved_documents WHERE document_id = $1",
                            [documentId]
                        );
                        
                        // Delete related records in user_permissions
                        await client.queryObject(
                            "DELETE FROM user_permissions WHERE document_id = $1",
                            [documentId]
                        );
                        
                        // Get the file path before deleting the document
                        const fileResult = await client.queryObject<{ file: string }>(
                            "SELECT file FROM documents WHERE id = $1",
                            [documentId]
                        );
                        
                        // Finally, delete the document
                        const result = await client.queryObject(
                            "DELETE FROM documents WHERE id = $1 RETURNING *",
                            [documentId]
                        );
                        
                        if (result.rows.length === 0) {
                            await client.queryObject("ROLLBACK");
                            return new Response(JSON.stringify({ message: "Document not found" }), {
                                status: 404,
                                headers: { "Content-Type": "application/json" }
                            });
                        }
                        
                        // Try to delete the physical file
                        if (fileResult.rows.length > 0 && fileResult.rows[0].file) {
                            try {
                                await Deno.remove(fileResult.rows[0].file);
                                console.log(`File deleted: ${fileResult.rows[0].file}`);
                            } catch (error) {
                                const fileError = error as Error;
                                console.warn(`Warning: Could not delete file: ${fileError.message}`);
                                // Continue with the deletion even if file removal fails
                            }
                        }
                        
                        // Commit transaction
                        await client.queryObject("COMMIT");
                        console.log(`Document with ID ${documentId} deleted successfully`);
                        
                        return new Response(JSON.stringify({ 
                            message: "Document deleted successfully",
                            id: documentId
                        }), {
                            status: 200,
                            headers: { "Content-Type": "application/json" }
                        });
                    } catch (error) {
                        // Rollback transaction on error
                        await client.queryObject("ROLLBACK");
                        throw error;
                    }
                } catch (error) {
                    console.error("Error deleting document:", error);
                    return new Response(JSON.stringify({ 
                        message: "Error deleting document",
                        error: error instanceof Error ? error.message : String(error)
                    }), {
                        status: 500,
                        headers: { "Content-Type": "application/json" }
                    });
                }
            }
        }
        
        // Handle other API routes
        if (path === "/api/topics") {
            if (method === "GET") {
                return await searchTopics(req);
            } else if (method === "POST") {
                return await createTopic(req);
            }
        }
        if (path === "/api/categories" && method === "GET") {
            try {
                const result = await client.queryObject<CategoryRow>(`
                    SELECT c.category_name, CAST(COUNT(*) AS INTEGER) as file_count 
                    FROM documents d
                    JOIN categories c ON d.category_id = c.id
                    GROUP BY c.category_name
                `);

                // Convert BigInt values to regular numbers
                const processedRows = result.rows.map((row: CategoryRow) => ({
                    category_name: row.category_name,
                    file_count: Number(row.file_count)
                }));

                return new Response(JSON.stringify(processedRows), {
                    headers: { "Content-Type": "application/json" },
                });
            } catch (error: unknown) {
                console.error("Error fetching categories:", error);
                return new Response(JSON.stringify({ 
                    error: "Failed to fetch categories",
                    details: error instanceof Error ? error.message : String(error)
                }), { 
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }

        // Handle volumes endpoint
        if (path === "/api/volumes" && method === "GET") {
            const category = url.searchParams.get('category');
            if (!category || category === 'All') {
                return new Response(JSON.stringify({ error: 'Category parameter is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                const volumes = await client.queryObject(`
                    SELECT DISTINCT d.volume 
                    FROM documents d
                    JOIN categories c ON d.category_id = c.id
                    WHERE LOWER(c.category_name) = LOWER($1)
                    AND d.volume IS NOT NULL 
                    AND d.volume != '' 
                    ORDER BY 
                        CASE 
                            WHEN d.volume ~ '^[0-9]+$' THEN CAST(d.volume AS INTEGER)
                            ELSE 999999
                        END,
                        d.volume`,
                    [category]
                );

                console.log(`Found volumes for category ${category}:`, volumes.rows);
                const typedRows = volumes.rows as { volume: string }[];
                return new Response(JSON.stringify(typedRows.map(row => row.volume)), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Error fetching volumes:', error);
                return new Response(JSON.stringify({ error: 'Failed to fetch volumes' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // If we get here, the API route wasn't handled
        return new Response(JSON.stringify({ error: "API endpoint not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Serve static files
    try {
        let filePath = path;
        
        // Handle root path
        if (filePath === "/") {
            filePath = "/public/index.html";
        }
        // Handle admin routes
        else if (filePath.startsWith("/admin/")) {
            filePath = `/admin${filePath.replace("/admin", "")}`;
        }
        // Handle image paths
        else if (filePath.startsWith("/images/") || filePath.startsWith("/components/images/")) {
            filePath = `/public${filePath}`;
        }
        // Handle other public files
        else if (!filePath.startsWith("/public/")) {
            filePath = `/public${filePath}`;
        }

        // Add the current directory prefix
        filePath = `.${filePath}`;
        console.log(`Attempting to serve file: ${filePath}`);

        // Determine content type
        const contentType = filePath.endsWith(".html") ? "text/html" :
                          filePath.endsWith(".css") ? "text/css" :
                          filePath.endsWith(".js") ? "application/javascript" :
                          filePath.endsWith(".png") ? "image/png" :
                          filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" :
                          filePath.endsWith(".svg") ? "image/svg+xml" :
                          "application/octet-stream";

        const file = await Deno.readFile(filePath);
        
        return new Response(file, {
            headers: {
                "content-type": contentType,
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return new Response("Not Found", { status: 404 });
    }
}

async function startServer() {
    console.log("Attempting to connect to the database...");
    try {
        await client.connect();
        console.log("Database connected successfully.");
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        Deno.exit(1);
    }

    console.log(`Server running on http://localhost:${PORT}`);
    await serve(handler, { port: PORT });
}

startServer();
