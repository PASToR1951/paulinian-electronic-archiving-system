import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { serveFile } from "https://deno.land/std@0.218.2/http/file_server.ts";
import { handleLoginRequest } from "./routes/login.ts";
import { client } from "./data/denopost_conn.ts";
import { handleDocumentSubmission } from "./controllers/upload-documents.ts";
import { fetchAuthors } from "./controllers/authors.ts";

const env = await load({ envPath: "./.env" });
console.log("Loaded Environment Variables:", env);

const PORT = 8000;
const REACT_URL = "http://localhost:5173"; // React Frontend

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    console.log(`Received request: ${req.method} ${url.pathname}`);

    // Handle Login
    if (url.pathname === "/login" && req.method === "POST") {
        return await handleLoginRequest(req); // ✅ No need to parse or modify the response
    }

    // Handle Author Search
    if (req.method === "GET" && url.pathname === "/authors") {
        return await fetchAuthors(req);
    }

    // Handle Document Submission
    if (url.pathname === "/submit-document" && req.method === "POST") {
        return await handleDocumentSubmission(req);
    }

    // Serve Static Files (Images, PDFs)
    if (req.method === "GET") {
        try {
            if (url.pathname.startsWith("/uploads/pdf/")) {
                return await serveFile(req, `.${url.pathname}`);
            }

            if (url.pathname.startsWith("/img/")) {
                return await serveFile(req, `./public${url.pathname}`);
            }

            // Serve Public & Admin Files
            let filePath = url.pathname;
            if (filePath === "/") {
                filePath = "/public/index.html"; // User's Landing Page
            } else if (filePath.startsWith("/admin/")) {
                filePath = `/admin${filePath.replace("/admin", "")}`; // Admin Dashboard
            } else {
                filePath = `/public${filePath}`;
            }

            return await serveFile(req, `${Deno.cwd()}${filePath}`);
        } catch (error) {
            console.error(`Error serving file: ${url.pathname}`, error);
            return new Response("File not found", { status: 404 });
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
