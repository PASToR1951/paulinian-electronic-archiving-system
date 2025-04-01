import { client } from "../data/denopost_conn.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

interface CategoryRow {
    id: number;
}

interface AuthorRow {
    author_id: string;
}

interface DocumentRow {
    id: number;
}

interface TopicRow {
    id: number;
}

export async function handleDocumentSubmission(req: Request): Promise<Response> {
    console.log("Received request: POST /submit-document");

    try {
        const formData = await req.formData();
        console.log("Full Form Data:", JSON.stringify(Object.fromEntries(formData.entries()), null, 2));

        // Extract form values
        const title = formData.get("title")?.toString();
        const publicationDate = formData.get("publication_date")?.toString();
        const volume = formData.get("volume-no")?.toString();
        const department = formData.get("department")?.toString();
        const categoryName = formData.get("category")?.toString();
        const abstract = formData.get("abstract")?.toString();
        const file = formData.get("file") as File;

        // Extract authors and topics
        let authors = [];
        let topics = [];

        try {
            authors = JSON.parse(formData.get("author")?.toString() || "[]");
            topics = JSON.parse(formData.get("topic")?.toString() || "[]");
        } catch (error) {
            console.error("Error parsing authors or topics:", error);
            return new Response(JSON.stringify({ message: "Invalid authors or topics format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log("Title:", title);
        console.log("Publication Date:", publicationDate);
        console.log("Authors:", authors);
        console.log("Topics:", topics);
        console.log("File:", file ? `{ name: ${file.name}, size: ${file.size}, type: ${file.type} }` : "No file uploaded");

        // Validate required fields
        if (!title || !publicationDate || !volume || !department || !categoryName || !abstract || !file) {
            console.warn("Missing required fields");
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch the category_id from the categories table
        let categoryId = null;
        if (categoryName) {
            const categoryResult = await client.queryObject<CategoryRow>(
                `SELECT id FROM categories WHERE category_name ILIKE $1`,
                [categoryName]
            );
            if (categoryResult.rows.length > 0) {
                categoryId = categoryResult.rows[0].id;
            } else {
                return new Response(JSON.stringify({ message: "Category not found" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // Ensure file storage directory exists
        const uploadDir = "./filepathpdf";
        await ensureDir(uploadDir);

        // Save the file
        const filePath = `${uploadDir}/${file.name}`;
        const fileData = new Uint8Array(await file.arrayBuffer());
        await Deno.writeFile(filePath, fileData);
        console.log(`File saved at: ${filePath}`);

        // Insert document data into the database
        const result = await client.queryObject<DocumentRow>(
            `INSERT INTO documents (title, publication_date, volume, department, category_id, abstract, file)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [title, publicationDate, volume, department, categoryId, abstract, filePath]
        );

        console.log("Document inserted, id:", result.rows[0].id);
        const documentId = result.rows[0].id;

        // Insert authors
        let authorIds = [];
        for (const author of authors) {
            // First check if author exists
            const existingAuthor = await client.queryObject<AuthorRow>(
                `SELECT author_id FROM Authors WHERE full_name = $1`,
                [author]
            );

            if (existingAuthor.rows.length > 0) {
                // Author exists, use existing ID
                authorIds.push(existingAuthor.rows[0].author_id);
            } else {
                // Author doesn't exist, insert new
                const authorResult = await client.queryObject<AuthorRow>(
                    `INSERT INTO Authors (full_name, affiliation, department) 
                    VALUES ($1, 'SPUP', $2) 
                    RETURNING author_id`,
                    [author, department]
                );
                if (authorResult.rows.length > 0) {
                    authorIds.push(authorResult.rows[0].author_id);
                } else {
                    console.warn(`Failed to insert author "${author}"`);
                }
            }
        }

        // Insert topics
        let topicIds = [];
        for (const topic of topics) {
            const topicResult = await client.queryObject<TopicRow>(
                `INSERT INTO topics (topic_name) VALUES ($1) ON CONFLICT (topic_name) DO NOTHING RETURNING id`,
                [topic]
            );
            if (topicResult.rows[0]?.id) {
                topicIds.push(topicResult.rows[0].id);
            }
        }

        // Update document with author_ids and topic_ids
        await client.queryObject(
            `UPDATE documents SET author_ids = $1, topic_ids = $2 WHERE id = $3`,
            [authorIds, topicIds, documentId]
        );

        console.log("Document, authors, and topics inserted successfully");

        return new Response(JSON.stringify({ 
            success: true,
            message: "Document uploaded and data inserted successfully!",
            redirect: "/admin/dashboard.html"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        console.error("Error processing form:", error);
        return new Response(JSON.stringify({ 
            success: false,
            message: "Internal Server Error", 
            error: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
} 