// File API endpoints for managing files in the database

/**
 * Handles file creation request
 * @param req The request object
 * @returns Response with created file data or error
 */
export async function handleCreateFile(req: Request): Promise<Response> {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }
    
    try {
        const body = await req.json();
        const result = await createFile(body);
        
        return new Response(JSON.stringify(result), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error creating file:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

/**
 * Handles getting file by ID
 * @param req The request object
 * @returns Response with file data or error
 */
export async function handleGetFileById(req: Request): Promise<Response> {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 });
    }
    
    try {
        // Extract file ID from URL
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        
        if (!id) {
            return new Response(JSON.stringify({ error: "File ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        const file = await getFileById(id);
        
        if (!file) {
            return new Response(JSON.stringify({ error: "File not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        return new Response(JSON.stringify(file), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error getting file:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Import these functions from a controller to be created next
import { createFile, getFileById } from "../controllers/fileController.ts";
