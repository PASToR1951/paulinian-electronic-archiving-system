import { client } from "../data/denopost_conn.ts";
import { ensureDir } from "https://deno.land/std@0.177.0/fs/mod.ts";
import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { pool } from "../db/db.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Document interface definition
interface Document {
    id: number;
    title: string;
    publication_date: string;
    volume: string;
    department: string;
    category_id: number;
    abstract: string;
    file: string;
    author_names?: string[];
    topic_names?: string[];
    created_at?: Date;
    updated_at?: Date;
}

interface CategoryRow {
    id: number;
    category_name: string;
}

interface AuthorRow {
    author_id: string;
    full_name: string;
}

interface DocumentRow {
    id: number;
}

interface TopicRow {
    id: number;
    topic_name: string;
}

interface State {
    pool: Pool;
}

interface FormDataFile {
    name: string;
    size: number;
    type: string;
    arrayBuffer(): Promise<ArrayBuffer>;
}

interface FormFields {
    title: string;
    publication_date: string;
    category_id: string;
    volume: string;
    department: string;
    abstract: string;
    author_ids?: string;
    topics?: string[];
}

type DocumentContext = RouterContext<string>;

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
        const abstract = formData.get("abstract")?.toString() || "";
        const file = formData.get("file") as unknown as FormDataFile;

        // Extract authors and topics
        let authors: string[] = [];
        let topics: string[] = [];

        try {
            const authorData = formData.get("author")?.toString();
            const topicsData = formData.get("topics")?.toString();
            if (authorData) authors = JSON.parse(authorData);
            if (topicsData) topics = JSON.parse(topicsData);
        } catch (error) {
            console.error("Error parsing authors or topics:", error);
            return new Response(JSON.stringify({ message: "Invalid authors or topics format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Log the extracted data
        console.log("Title:", title);
        console.log("Publication Date:", publicationDate);
        console.log("Authors:", authors);
        console.log("Topics:", topics);
        console.log("File:", file ? { name: file.name } : "No file uploaded");

        // Validate required fields
        if (!title || !publicationDate || !volume || !department || !categoryName || !file) {
            console.warn("Missing required fields");
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Start a transaction
        await client.queryObject('BEGIN');

        try {
            // Fetch the category_id from the categories table
            let categoryId = null;
            if (categoryName) {
                const categoryResult = await client.queryObject<CategoryRow>(
                    `SELECT id, category_name FROM categories WHERE category_name ILIKE $1`,
                    [categoryName]
                );
                if (categoryResult.rows.length > 0) {
                    categoryId = categoryResult.rows[0].id;
                } else {
                    await client.queryObject('ROLLBACK');
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
            console.log(`File saved at: ${filePath}`);

            // Insert document data into the database
            const result = await client.queryObject<DocumentRow>(
                `INSERT INTO documents (title, publication_date, volume, department, category_id, abstract, file)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [title, publicationDate, volume, department, categoryId, abstract, filePath]
            );

            const documentId = result.rows[0].id;
            console.log("Document inserted, id:", documentId);

            // Process authors
            for (const authorName of authors) {
                // Check if author exists
                let authorResult = await client.queryObject<AuthorRow>(
                    `SELECT author_id FROM Authors WHERE full_name = $1`,
                    [authorName]
                );

                let authorId;
                if (authorResult.rows.length > 0) {
                    // Author exists
                    authorId = authorResult.rows[0].author_id;
                } else {
                    // Create new author
                    const newAuthorResult = await client.queryObject<AuthorRow>(
                        `INSERT INTO Authors (full_name, affiliation, department) 
                        VALUES ($1, 'SPUP', $2) 
                        RETURNING author_id`,
                        [authorName, department]
                    );
                    authorId = newAuthorResult.rows[0].author_id;
                }

                // Create document-author relationship
                await client.queryObject(
                    `INSERT INTO document_authors (document_id, author_id) 
                    VALUES ($1, $2)
                    ON CONFLICT (document_id, author_id) DO NOTHING`,
                    [documentId, authorId]
                );
            }

            // Process topics
            for (const topicName of topics) {
                // Check if topic exists
                let topicResult = await client.queryObject<TopicRow>(
                    `SELECT id FROM topics WHERE topic_name = $1`,
                    [topicName]
                );

                let topicId;
                if (topicResult.rows.length > 0) {
                    // Topic exists
                    topicId = topicResult.rows[0].id;
                } else {
                    // Create new topic
                    const newTopicResult = await client.queryObject<TopicRow>(
                        `INSERT INTO topics (topic_name) VALUES ($1) RETURNING id`,
                        [topicName]
                    );
                    topicId = newTopicResult.rows[0].id;
                }

                // Create document-topic relationship
                await client.queryObject(
                    `INSERT INTO document_topics (document_id, topic_id) 
                    VALUES ($1, $2)
                    ON CONFLICT (document_id, topic_id) DO NOTHING`,
                    [documentId, topicId]
                );
            }

            // Commit the transaction
            await client.queryObject('COMMIT');

            return new Response(JSON.stringify({ 
                success: true,
                message: "Document uploaded and data inserted successfully!",
                redirect: "/admin/dashboard.html"
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } catch (error) {
            // Rollback the transaction if anything fails
            await client.queryObject('ROLLBACK');
            throw error;
        }

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

export async function submitDocument(ctx: DocumentContext) {
    try {
        const body = await ctx.request.body({ type: "form-data" }).value;
        const formData = await body.read();
        const fields = formData.fields;
        const files = formData.files;

        const title = fields.title;
        const publicationDate = fields.publication_date;
        const categoryId = fields.category_id;
        const volume = fields.volume;
        const department = fields.department;
        const abstract = fields.abstract;
        const authorNames = fields.author_ids ? fields.author_ids.split(',') : [];
        const file = files ? files[0] : null;

        console.log("Title:", title);
        console.log("Publication Date:", publicationDate);
        console.log("Authors:", authorNames);
        console.log("File:", file ? `{ name: ${file.name} }` : "No file uploaded");

        // Validate required fields
        if (!title || !publicationDate || !volume || !department || !categoryId || !abstract || !file) {
            console.warn("Missing required fields");
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch the category_id from the categories table
        let categoryName = null;
        if (categoryId) {
            const categoryResult = await client.queryObject<CategoryRow>(
                `SELECT category_name FROM categories WHERE id = $1`,
                [categoryId]
            );
            if (categoryResult.rows.length > 0) {
                categoryName = categoryResult.rows[0].category_name;
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

        // Process authors
        const processedAuthorIds = [];
        for (const authorName of authorNames) {
            // First check if author exists
            const existingAuthor = await client.queryObject<AuthorRow>(
                `SELECT author_id FROM Authors WHERE full_name = $1`,
                [authorName]
            );

            if (existingAuthor.rows.length > 0) {
                // Author exists, use existing ID
                processedAuthorIds.push(existingAuthor.rows[0].author_id);
            } else {
                // Author doesn't exist, insert new
                const authorResult = await client.queryObject<AuthorRow>(
                    `INSERT INTO Authors (full_name, affiliation, department) 
                    VALUES ($1, 'SPUP', $2) 
                    RETURNING author_id`,
                    [authorName, department]
                );
                if (authorResult.rows.length > 0) {
                    processedAuthorIds.push(authorResult.rows[0].author_id);
                } else {
                    console.warn(`Failed to insert author "${authorName}"`);
                }
            }
        }

        // Insert document-author relationships
        if (processedAuthorIds.length > 0) {
            const authorValues = processedAuthorIds.map((authorId: string) => 
                `(${documentId}, '${authorId}')`
            ).join(',');

            await client.queryObject(
                `INSERT INTO document_authors (document_id, author_id)
                VALUES ${authorValues}`
            );
        }

        console.log("Document and authors inserted successfully");

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

export async function updateDocument(ctx: DocumentContext) {
    try {
        const body = await ctx.request.body({ type: "form-data" }).value;
        const formData = await body.read();
        const fields = formData.fields as unknown as FormFields;
        const files = formData.files;

        const documentId = ctx.params.id;
        const title = fields.title;
        const publicationDate = fields.publication_date;
        const categoryId = fields.category_id;
        const volume = fields.volume;
        const department = fields.department;
        const abstract = fields.abstract;
        const selectedAuthorIds = fields.author_ids ? fields.author_ids.split(',') : [];
        const selectedTopics = fields.topics || [];
        const file = files ? files[0] : null;

        console.log("Title:", title);
        console.log("Publication Date:", publicationDate);
        console.log("Authors:", selectedAuthorIds);
        console.log("File:", file ? `{ name: ${file.name} }` : "No file uploaded");

        // ... rest of the existing code ...
    } catch (error: unknown) {
        if (error instanceof Error) {
            ctx.response.status = 500;
            ctx.response.body = { error: error.message };
        } else {
            ctx.response.status = 500;
            ctx.response.body = { error: "An unknown error occurred" };
        }
    }
}

// Update getDocumentById to join with document_authors
export async function getDocumentById(ctx: RouterContext) {
    try {
        const id = ctx.params.id;
        const client = await pool.connect();

        const result = await client.queryObject<Document>(
            `SELECT 
                d.*,
                ARRAY_AGG(DISTINCT a.full_name) FILTER (WHERE a.full_name IS NOT NULL) as author_names,
                ARRAY_AGG(DISTINCT t.topic_name) FILTER (WHERE t.topic_name IS NOT NULL) as topic_names
             FROM documents d
             LEFT JOIN document_authors da ON d.id = da.document_id
             LEFT JOIN authors a ON da.author_id = a.author_id
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
        ctx.response.status = 500;
        ctx.response.body = { message: error.message };
    }
} 