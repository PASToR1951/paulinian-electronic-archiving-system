import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { serveFile } from "https://deno.land/std@0.218.2/http/file_server.ts";
import { handleLoginRequest } from "./routes/login.ts";
import { client } from "./data/denopost_conn.ts";
import { handleDocumentSubmission } from "./controllers/upload-documents.ts";
import { searchAuthors } from "./controllers/author-Controller.ts";
import { searchTopics, createTopic } from "./controllers/topic-Controller.ts";
import { fetchCategories, fetchDocuments } from "./controllers/document-Controller.ts";
import { handler as categoriesHandler } from "./controllers/document-Controller.ts";

const env = await load({ envPath: "./.env" });
console.log("Loaded Environment Variables:", env);

const PORT = 8000;

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    console.log(`Received request: ${req.method} ${url.pathname}`);

    // Handle Login
    if (url.pathname === "/login" && req.method === "POST") {
        return await handleLoginRequest(req);
    }

    // Handle Author Search
    if (req.method === "GET" && url.pathname === "/api/authors") {
        return await searchAuthors(req);
    }

    // Handle Topic Search
    if (req.method === "GET" && url.pathname === "/api/topics") {
        return await searchTopics(req);
    }

    // Handle Creating Topics
    if (req.method === "POST" && url.pathname === "/api/topics") {
        return await createTopic(req);
    }

    // Handle Document Submission
    if (url.pathname === "/submit-document" && req.method === "POST") {
        return await handleDocumentSubmission(req);
    }
    
    // Fetch Categories with File Count
    if (url.pathname === "/api/categories" && req.method === "GET") {
        return await fetchCategories();
    }

    // Fetch Documents List
    if (url.pathname === "/api/documents" && req.method === "GET") {
        return await fetchDocuments(req);
    }
    // Serve Static Files (Images, PDFs, etc.)
    if (req.method === "GET") {
        try {
            if (url.pathname.startsWith("/uploads/pdf/")) {
                return await serveFile(req, `.${url.pathname}`);
            }
            if (url.pathname.startsWith("/img/")) {
                return await serveFile(req, `./public${url.pathname}`);
            }
            let filePath = url.pathname;
            if (filePath === "/") {
                filePath = "/public/index.html";
            } else if (filePath.startsWith("/admin/")) {
                filePath = `/admin${filePath.replace("/admin", "")}`;
            } else {
                filePath = `/public${filePath}`;
            }
            return await serveFile(req, `${Deno.cwd()}${filePath}`);
        } catch (error) {
            console.error(`Error serving file: ${url.pathname}`, error);
            return new Response("File not found", { status: 404 });
        }
    }
    // Fetch Categories with File Count
if (url.pathname === "/api/categories" && req.method === "GET") {
    try {
        const result = await client.queryObject("SELECT category, COUNT(*) as file_count FROM documents GROUP BY category");
        return new Response(JSON.stringify(result.rows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

// Fetch Documents List
if (url.pathname === "/api/documents" && req.method === "GET") {
    try {
        const result = await client.queryObject("SELECT title, authors, year, cover_path FROM documents");
        return new Response(JSON.stringify(result.rows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
    return new Response("Not Found", { status: 404 });
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
    serve(handler, { port: PORT });
}

startServer();

