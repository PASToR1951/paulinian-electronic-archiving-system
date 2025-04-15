import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { RouterContext } from "https://deno.land/x/oak@v12.6.1/router.ts";
import { helpers } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Response } from "https://deno.land/x/oak@v12.6.1/response.ts";
import { fetchCategories, fetchDocuments, fetchVolumesByCategory } from "../controllers/document-Controller.ts";
import { client } from "../data/denopost_conn.ts";

export const documentsRouter = new Router();

// Categories endpoint
documentsRouter.get("/api/categories", async (ctx) => {
    const response = await fetchCategories();
    ctx.response.body = await response.json();
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
});

// Documents endpoint
documentsRouter.get("/api/documents", async (ctx: RouterContext<"/api/documents">) => {
    try {
        // Create a native Request object from the Oak context
        const request = new Request(ctx.request.url, {
            method: ctx.request.method,
            headers: ctx.request.headers,
        });
        
        const response = await fetchDocuments(request);
        const responseData = await response.text();
        const documents = JSON.parse(responseData);
        
        // For each document, fetch its topics
        for (const doc of documents) {
            const topicsResult = await client.queryObject<{ topic_name: string }>(
                `SELECT t.topic_name 
                 FROM topics t
                 JOIN document_topics dt ON t.id = dt.topic_id
                 WHERE dt.document_id = $1`,
                [doc.id]
            );
            doc.topics = topicsResult.rows.map(row => row.topic_name);
        }
        
        ctx.response.body = documents;
        ctx.response.status = response.status;
        ctx.response.headers = response.headers;
    } catch (error) {
        console.error("Error fetching documents:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Internal server error" };
    }
});

// Volumes endpoint
<<<<<<< Updated upstream
documentsRouter.get("/api/volumes", async (ctx) => {
    const response = await fetchVolumesByCategory(ctx.request);
=======
router.get("/api/volumes", async (ctx) => {
    // Create a native Request object from the Oak context
    const request = new Request(ctx.request.url, {
        method: ctx.request.method,
        headers: ctx.request.headers,
    });
    
    const response = await fetchVolumesByCategory(request);
>>>>>>> Stashed changes
    ctx.response.body = await response.json();
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
});

// Get single document by ID
documentsRouter.get("/api/documents/:id", async (ctx: RouterContext<"/api/documents/:id">) => {
    try {
        const id = ctx.params.id;
        if (!id) {
            ctx.response.status = 400;
            ctx.response.body = { message: "Document ID is required" };
            return;
        }

        const result = await client.queryObject<{
            id: number;
            title: string;
            author: string;
            publication_date: string;
            category: string;
            abstract: string | null;
            volume: string | null;
            updated_at: string;
            topics: string[];
        }>(
            `SELECT d.*, 
                array_agg(DISTINCT t.topic_name) FILTER (WHERE t.topic_name IS NOT NULL) as topics
             FROM documents d
             LEFT JOIN document_topics dt ON d.id = dt.document_id
             LEFT JOIN topics t ON dt.topic_id = t.id
             WHERE d.id = $1
             GROUP BY d.id`,
            [id]
        );

        if (result.rows.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Document not found" };
            return;
        }

        ctx.response.body = result.rows[0];
    } catch (error) {
        console.error("Error fetching document:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Internal server error" };
    }
});

// Update document
documentsRouter.put("/api/documents/:id", async (ctx: RouterContext<"/api/documents/:id">) => {
    try {
        const id = ctx.params.id;
        if (!id) {
            ctx.response.status = 400;
            ctx.response.body = { message: "Document ID is required" };
            return;
        }

        const formData = await ctx.request.body({ type: "form-data" }).value;
        const formDataEntries = formData.entries();
        const files = formData.files;

        const documentData: Record<string, any> = {};
        let topics: string[] = [];

        for (const [key, value] of formDataEntries) {
            if (key === "topics") {
                try {
                    // Try to parse topics as JSON array
                    const parsedTopics = JSON.parse(value as string);
                    topics = Array.isArray(parsedTopics) ? parsedTopics : [parsedTopics];
                } catch (e) {
                    // If parsing fails, treat it as a single topic
                    topics = [value as string];
                }
            } else {
                documentData[key] = value;
            }
        }

        // Validate required fields
        const requiredFields = ["title", "author", "publication_date", "category"];
        for (const field of requiredFields) {
            if (!documentData[field]) {
                ctx.response.status = 400;
                ctx.response.body = { message: `${field} is required` };
                return;
            }
        }

        // Start transaction
        await client.queryObject("BEGIN");

        try {
            // Handle file upload if a new file is provided
            let filePath = null;
            if (files && files.length > 0) {
                const file = files[0];
                const uploadDir = "./uploads";
                await Deno.mkdir(uploadDir, { recursive: true });
                filePath = `${uploadDir}/${Date.now()}-${file.originalName}`;
                await Deno.writeFile(filePath, file.content);
            }

            // Update document
            const result = await client.queryObject(
                `UPDATE documents 
                 SET title = $1, author = $2, publication_date = $3, 
                     category = $4, abstract = $5, volume = $6,
                     file = COALESCE($8, file),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7
                 RETURNING *`,
                [
                    documentData.title,
                    documentData.author,
                    documentData.publication_date,
                    documentData.category,
                    documentData.abstract || null,
                    documentData.volume || null,
                    id,
                    filePath
                ]
            );

            if (result.rows.length === 0) {
                await client.queryObject("ROLLBACK");
                ctx.response.status = 404;
                ctx.response.body = { message: "Document not found" };
                return;
            }

            // Update topics
            if (topics.length > 0) {
                // Delete existing topics
                await client.queryObject(
                    "DELETE FROM document_topics WHERE document_id = $1",
                    [id]
                );

                // Insert new topics
                for (const topic of topics) {
                    if (!topic) continue; // Skip empty topics
                    
                    // Get or create topic
                    const topicResult = await client.queryObject<{ id: number }>(
                        "INSERT INTO topics (topic_name) VALUES ($1) ON CONFLICT (topic_name) DO UPDATE SET topic_name = EXCLUDED.topic_name RETURNING id",
                        [topic]
                    );
                    const topicId = topicResult.rows[0].id;

                    // Link topic to document
                    await client.queryObject(
                        "INSERT INTO document_topics (document_id, topic_id) VALUES ($1, $2)",
                        [id, topicId]
                    );
                }
            }

            await client.queryObject("COMMIT");
            
            // Return the updated document with its topics
            const updatedDoc = await client.queryObject<{
                id: number;
                title: string;
                author: string;
                publication_date: string;
                category: string;
                abstract: string | null;
                volume: string | null;
                updated_at: string;
                topics: string[];
            }>(
                `SELECT d.*, 
                    array_agg(DISTINCT t.topic_name) FILTER (WHERE t.topic_name IS NOT NULL) as topics
                 FROM documents d
                 LEFT JOIN document_topics dt ON d.id = dt.document_id
                 LEFT JOIN topics t ON dt.topic_id = t.id
                 WHERE d.id = $1
                 GROUP BY d.id`,
                [id]
            );

            ctx.response.body = updatedDoc.rows[0];
        } catch (error) {
            await client.queryObject("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("Error updating document:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Internal server error" };
    }
});

// Delete document
documentsRouter.delete("/api/documents/:id", async (context: RouterContext<"/api/documents/:id">) => {
    try {
        const id = context.params?.id;
        if (!id) {
            context.response.status = 400;
            context.response.body = { message: "Document ID is required" };
            return;
        }

        console.log(`Attempting to delete document with ID: ${id}`);
        
        // Begin transaction
        await client.queryObject("BEGIN");
        
        try {
            // First, delete related records in document_authors
            await client.queryObject(
                "DELETE FROM document_authors WHERE document_id = $1",
                [id]
            );
            
            // Delete related records in document_topics
            await client.queryObject(
                "DELETE FROM document_topics WHERE document_id = $1",
                [id]
            );
            
            // Delete related records in saved_documents
            await client.queryObject(
                "DELETE FROM saved_documents WHERE document_id = $1",
                [id]
            );
            
            // Delete related records in user_permissions
            await client.queryObject(
                "DELETE FROM user_permissions WHERE document_id = $1",
                [id]
            );
            
            // Get the file path before deleting the document
            const fileResult = await client.queryObject<{ file: string }>(
                "SELECT file FROM documents WHERE id = $1",
                [id]
            );
            
            // Finally, delete the document
            const result = await client.queryObject<{
                id: number;
                title: string;
                author: string;
                publication_date: string;
                category: string;
                abstract: string | null;
                volume: string | null;
                updated_at: string;
            }>(
                "DELETE FROM documents WHERE id = $1 RETURNING *",
                [id]
            );
            
            if (result.rows.length === 0) {
                await client.queryObject("ROLLBACK");
                console.log(`Document with ID ${id} not found`);
                context.response.status = 404;
                context.response.body = { message: "Document not found" };
                return;
            }
            
            // Try to delete the physical file
            if (fileResult.rows.length > 0 && fileResult.rows[0].file) {
                try {
                    await Deno.remove(fileResult.rows[0].file);
                    console.log(`File deleted: ${fileResult.rows[0].file}`);
                } catch (error) {
                    console.warn(`Warning: Could not delete file: ${error instanceof Error ? error.message : String(error)}`);
                    // Continue with the deletion even if file removal fails
                }
            }
            
            // Commit transaction
            await client.queryObject("COMMIT");
            console.log(`Document with ID ${id} deleted successfully`);
            
            context.response.body = { message: "Document deleted successfully" };
        } catch (error) {
            // Rollback transaction on error
            await client.queryObject("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("Error deleting document:", error);
        context.response.status = 500;
        context.response.body = { 
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        };
    }
});

// Search topics
documentsRouter.get("/api/topics/search", async (ctx: RouterContext<"/api/topics/search">) => {
    try {
        const query = ctx.request.url.searchParams.get("q") || "";
        
        const result = await client.queryObject<{ id: number; topic_name: string }>(
            `SELECT id, topic_name 
             FROM topics 
             WHERE LOWER(topic_name) LIKE LOWER($1)
             ORDER BY topic_name
             LIMIT 10`,
            [`%${query}%`]
        );

        ctx.response.body = result.rows;
    } catch (error) {
        console.error("Error searching topics:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Internal server error" };
    }
});
