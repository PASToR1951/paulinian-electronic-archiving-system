import { Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import type { RouterContext } from "https://deno.land/x/oak@v17.1.4/router.ts";
import { helpers } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { Response } from "https://deno.land/x/oak@v17.1.4/response.ts";
import { fetchCategories, fetchDocuments, fetchVolumesByCategory } from "../controllers/document-Controller.ts";
import { client } from "../data/denopost_conn.ts";

const router = new Router();

// Categories endpoint
router.get("/api/categories", async (ctx) => {
    const response = await fetchCategories();
    ctx.response.body = await response.json();
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
});

// Documents endpoint
router.get("/api/documents", async (ctx: RouterContext<"/api/documents">) => {
    try {
        const response = await fetchDocuments(ctx.request);
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
router.get("/api/volumes", async (ctx) => {
    const response = await fetchVolumesByCategory(ctx.request);
    ctx.response.body = await response.json();
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
});

// Update document
router.put("/api/documents/:id", async (ctx: RouterContext<"/api/documents/:id">) => {
    try {
        // Convert Oak context to native Request
        const req = new Request(ctx.request.url, {
            method: ctx.request.method,
            headers: ctx.request.headers,
            body: await ctx.request.body({ type: "json" }).value
        });
        
        // Get the request body using the native Request type
        const body = await req.json();
        
        // Validate required fields
        if (!body.title || !body.author || !body.publication_date || !body.category) {
            ctx.response.status = 400;
            ctx.response.body = { message: "Missing required fields" };
            return;
        }
        
        // Begin transaction
        await client.queryObject("BEGIN");
        
        try {
            // Update document in database
            const result = await client.queryObject`
                UPDATE documents 
                SET title = $1, 
                    author = $2, 
                    publication_date = $3, 
                    category_id = (SELECT id FROM categories WHERE LOWER(category_name) = LOWER($4)),
                    abstract = $5, 
                    volume = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *
            `;
            
            if (result.rows.length === 0) {
                await client.queryObject("ROLLBACK");
                ctx.response.status = 404;
                ctx.response.body = { message: "Document not found" };
                return;
            }

            // Handle topics
            if (body.topics && Array.isArray(body.topics)) {
                // First, delete existing document_topics
                await client.queryObject(
                    "DELETE FROM document_topics WHERE document_id = $1",
                    [ctx.params.id]
                );

                // Insert new topics
                for (const topicName of body.topics) {
                    // Check if topic exists
                    let topicResult = await client.queryObject<{ id: number }>(
                        `SELECT id FROM topics WHERE topic_name = $1`,
                        [topicName]
                    );

                    let topicId: number;
                    if (topicResult.rows.length > 0) {
                        topicId = topicResult.rows[0].id;
                    } else {
                        // Create new topic
                        const newTopicResult = await client.queryObject<{ id: number }>(
                            `INSERT INTO topics (topic_name) VALUES ($1) RETURNING id`,
                            [topicName]
                        );
                        topicId = newTopicResult.rows[0].id;
                    }

                    // Link topic to document
                    await client.queryObject(
                        `INSERT INTO document_topics (document_id, topic_id) VALUES ($1, $2)
                         ON CONFLICT (document_id, topic_id) DO NOTHING`,
                        [ctx.params.id, topicId]
                    );
                }
            }

            // Commit transaction
            await client.queryObject("COMMIT");
            
            // Fetch updated document with topics
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
                [ctx.params.id]
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
router.delete("/api/documents/:id", async (context: RouterContext<"/api/documents/:id">) => {
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

export default router;
