import { client } from "../data/denopost_conn.ts"; // Database connection
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

interface DocumentResult {
    id: number;
}

interface TopicResult {
    id: number;
}

interface AuthorResult {
    author_id: string;
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
        let authors: string[] = [];
        let topics: string[] = [];

        try {
            authors = JSON.parse(formData.get("author")?.toString() || "[]");
            topics = JSON.parse(formData.get("topic")?.toString() || "[]");
            console.log("Parsed topics:", topics);
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

        // Start transaction
        await client.queryObject("BEGIN");

        try {
            // Fetch the category_id
            let categoryId: number | null = null;
            if (categoryName) {
                const categoryResult = await client.queryObject<{ id: number }>(
                    `SELECT id FROM categories WHERE category_name ILIKE $1`,
                    [categoryName]
                );
                if (categoryResult.rows.length > 0) {
                    categoryId = categoryResult.rows[0].id;
                } else {
                    await client.queryObject("ROLLBACK");
                    return new Response(JSON.stringify({ message: "Category not found" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    });
                }
            }

            // Save the file
            const uploadDir = "./filepathpdf";
            await ensureDir(uploadDir);
            const filePath = `${uploadDir}/${file.name}`;
            const fileData = new Uint8Array(await file.arrayBuffer());
            await Deno.writeFile(filePath, fileData);

            // Insert document
            const documentResult = await client.queryObject<DocumentResult>(
                `INSERT INTO documents (title, publication_date, volume, department, category_id, abstract, file)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [title, publicationDate, volume, department, categoryId, abstract, filePath]
            );

            const documentId = documentResult.rows[0].id;
            console.log("Document inserted with ID:", documentId);

            // Process topics
            for (const topicName of topics) {
                // Check if topic exists or create new one
                let topicResult = await client.queryObject<TopicResult>(
                    `INSERT INTO topics (topic_name) 
                     VALUES ($1) 
                     ON CONFLICT (topic_name) DO UPDATE SET topic_name = EXCLUDED.topic_name 
                     RETURNING id`,
                    [topicName]
                );

                const topicId = topicResult.rows[0].id;
                console.log(`Topic "${topicName}" has ID: ${topicId}`);

                // Insert into document_topics junction table
                await client.queryObject(
                    `INSERT INTO document_topics (document_id, topic_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT (document_id, topic_id) DO NOTHING`,
                    [documentId, topicId]
                );
            }

            // Process authors
            const authorIds = [];
            for (const authorName of authors) {
                let authorResult = await client.queryObject<AuthorResult>(
                    `SELECT author_id FROM authors WHERE full_name = $1`,
                    [authorName]
                );

                let authorId: string;
                if (authorResult.rows.length > 0) {
                    authorId = authorResult.rows[0].author_id;
                    console.log(`Using existing author "${authorName}" with ID ${authorId}`);
                } else {
                    const newAuthorResult = await client.queryObject<AuthorResult>(
                        `INSERT INTO authors (full_name, affiliation, department) 
                         VALUES ($1, 'SPUP', $2) RETURNING author_id`,
                        [authorName, department]
                    );
                    authorId = newAuthorResult.rows[0].author_id;
                    console.log(`Created new author "${authorName}" with ID ${authorId}`);
                }
                authorIds.push(authorId);
            }

            // Update document with author_ids
            await client.queryObject(
                `UPDATE documents SET author_ids = $1 WHERE id = $2`,
                [authorIds, documentId]
            );

            await client.queryObject("COMMIT");

            return new Response(JSON.stringify({ 
                message: "Document uploaded and data inserted successfully!",
                documentId: documentId,
                topics: topics,
                authors: authors
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } catch (error: unknown) {
            await client.queryObject("ROLLBACK");
            throw error;
        }

    } catch (error: unknown) {
        console.error("Error processing form:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return new Response(JSON.stringify({ message: "Internal Server Error", error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
