import { client } from "../data/denopost_conn.ts"; // Database connection
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

export async function handleDocumentSubmission(req: Request): Promise<Response> {
    console.log("Received request: POST /submit-document");

    try {
        const formData = await req.formData();
        console.log("Full Form Data:", JSON.stringify(Object.fromEntries(formData.entries()), null, 2));

        // Extract form values
        const title = formData.get("title")?.toString();
        const publicationDate = formData.get("publication_date")?.toString(); // Changed from "year"
        const volume = formData.get("volume-no")?.toString();
        const department = formData.get("department")?.toString();
        const categoryName = formData.get("category")?.toString(); // Category name
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

        // Fetch the category_id from the categories table based on category name (case-insensitive search)
        let categoryId: number | null = null;
        if (categoryName) {
            const categoryResult = await client.queryObject(
                `SELECT id FROM categories WHERE category_name ILIKE $1`, // Using ILIKE for case-insensitive match
                [categoryName]
            );
            if (categoryResult.rows.length > 0) {
                categoryId = categoryResult.rows[0].id;
            } else {
                console.error("Category not found in the database");
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
        const result = await client.queryObject(
            `INSERT INTO documents (title, publication_date, volume, department, category_id, abstract, file)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [title, publicationDate, volume, department, categoryId, abstract, filePath]
        );

        console.log("Document inserted, id:", result.rows[0].id);
        const documentId = result.rows[0].id;

        // Insert authors and collect author IDs
        let authorIds = [];
        if (authors.length > 0) {
            for (const author of authors) {
                // First check if the author already exists - using full_name field
                let authorId;
                const existingAuthor = await client.queryObject(
                    `SELECT author_id FROM authors WHERE full_name = $1`,
                    [author]
                );
                
                if (existingAuthor.rows.length > 0) {
                    // Author exists, get their ID
                    authorId = existingAuthor.rows[0].author_id;
                    console.log(`Using existing author "${author}" with ID ${authorId}`);
                } else {
                    // Author doesn't exist, insert them - set required fields with defaults
                    const authorResult = await client.queryObject(
                        `INSERT INTO authors (full_name, affiliation, department) 
                         VALUES ($1, 'Unknown Affiliation', 'Unknown Department') 
                         RETURNING author_id`,
                        [author]
                    );
                    authorId = authorResult.rows[0].author_id;
                    console.log(`Created new author "${author}" with ID ${authorId}`);
                }
                
                // Always add the ID to our array
                authorIds.push(authorId);
            }
        }

        // Insert topics and collect topic IDs
        let topicIds = [];
        for (const topic of topics) {
            const topicResult = await client.queryObject(
                `INSERT INTO topics (topic_name) VALUES ($1) ON CONFLICT (topic_name) DO NOTHING RETURNING id`,
                [topic]
            );
            const topicId = topicResult.rows[0]?.id;
            if (topicId) {
                topicIds.push(topicId); // Add topic ID to the array
            }
        }

        // Update document with author_ids and topic_ids
        await client.queryObject(
            `UPDATE documents 
            SET author_ids = $1, topic_ids = $2 
            WHERE id = $3`,
            [authorIds, topicIds, documentId]
        );

        console.log("Document, authors, and topics inserted successfully");

        return new Response(JSON.stringify({ message: "Document uploaded and data inserted successfully!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error processing form:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error", error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
