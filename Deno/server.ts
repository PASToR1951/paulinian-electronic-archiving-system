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
    console.log(`Received ${req.method} request for ${url.pathname}`);

    // Handle login and logout routes
    if (url.pathname === "/login" && req.method === "POST") {
        return handleLoginRequest(req);
    }
    if (url.pathname === "/logout" && req.method === "GET") {
        return handleLogout(req);
    }
    if (url.pathname === "/sidebar" && req.method === "GET") {
        return handleSidebar(req);
    }

    // Check if the requested path is a protected route
    if (protectedRoutes.includes(url.pathname)) {
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
    if (url.pathname === "/api/topics") {
        if (req.method === "GET") {
            return await searchTopics(req);
        } else if (req.method === "POST") {
            return await createTopic(req);
        }
    }
    if (req.method === "GET" && url.pathname === "/api/authors") {
        return await searchAuthors(req);
    }
    if (url.pathname === "/submit-document" && req.method === "POST") {
        return await handleDocumentSubmission(req);
    }
    if (url.pathname === "/api/categories" && req.method === "GET") {
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
    if (url.pathname === "/api/documents" && req.method === "GET") {
        try {
            const result = await client.queryObject<DocumentRow>(`
                SELECT 
                    d.id,
                    d.title,
                    d.publication_date,
                    d.file,
                    c.category_name,
                    COALESCE(array_agg(DISTINCT a.full_name) FILTER (WHERE a.full_name IS NOT NULL), ARRAY[]::text[]) as author_names
                FROM documents d
                LEFT JOIN categories c ON d.category_id = c.id
                LEFT JOIN Authors a ON a.author_id = ANY(d.author_ids)
                GROUP BY d.id, d.title, d.publication_date, d.file, c.category_name
                ORDER BY d.publication_date DESC
            `);

            // Convert BigInt values and format dates
            const processedRows = result.rows.map((row: DocumentRow) => ({
                id: Number(row.id),
                title: row.title,
                publication_date: row.publication_date ? new Date(row.publication_date).toISOString().split('T')[0] : null,
                file: row.file,
                category_name: row.category_name,
                author_names: Array.isArray(row.author_names) ? row.author_names : []
            }));

            return new Response(JSON.stringify(processedRows), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: unknown) {
            console.error("Error fetching documents:", error);
            return new Response(JSON.stringify({ 
                error: "Failed to fetch documents",
                details: error instanceof Error ? error.message : String(error)
            }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    // Serve static files
    try {
        let filePath = url.pathname;
        
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
