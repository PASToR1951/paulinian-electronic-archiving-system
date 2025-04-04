import { Router } from "https://deno.land/x/oak/mod.ts";
import { fetchCategories, fetchDocuments } from "../controllers/document-Controller.ts";
import { client } from "../data/denopost_conn.ts";
import { RouterContext } from "https://deno.land/x/oak/mod.ts";

const router = new Router();

router.get("/api/categories", fetchCategories);
router.get("/api/documents", fetchDocuments);

// Update document
router.put("/api/documents/:id", async (ctx: RouterContext<"/api/documents/:id">) => {
    try {
        const id = ctx.params.id;
        const body = await ctx.request.body({ type: "json" }).value;
        
        // Validate required fields
        if (!body.title || !body.author || !body.publication_date || !body.category) {
            ctx.response.status = 400;
            ctx.response.body = { message: "Missing required fields" };
            return;
        }
        
        // Update document in database
        const result = await client.queryObject(
            `UPDATE documents 
             SET title = $1, 
                 author = $2, 
                 publication_date = $3, 
                 category = $4, 
                 abstract = $5, 
                 topics = $6,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [
                body.title,
                body.author,
                body.publication_date,
                body.category,
                body.abstract || null,
                body.topics || null,
                id
            ]
        );
        
        if (result.rows.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Document not found" };
            return;
        }
        
        ctx.response.body = result.rows[0];
    } catch (error) {
        console.error("Error updating document:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Internal server error" };
    }
});

// Delete document
router.delete("/api/documents/:id", async (context: RouterContext) => {
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
            // First, delete related records in document_topics
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
            
            // Finally, delete the document
            const result = await client.queryObject(
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
