import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { client } from "../data/denopost_conn.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

// Ensure Deno namespace is available
declare const Deno: any;

/**
 * Handles single document upload submissions
 */
export async function handleSingleDocumentUpload(ctx: any, formData: FormData): Promise<void> {
    console.log("========== STARTING SINGLE DOCUMENT UPLOAD ==========");
    console.log("Processing single document upload at:", new Date().toISOString());
    
    try {
        // Log the entire form data for debugging
        console.log("Form data keys received:");
        for (const key of formData.keys()) {
            console.log(` - ${key}`);
        }
        console.log("Starting single document upload process with detailed logging");
        
        // Extract form values
        const title = formData.get("title")?.toString();
        let publicationDate = formData.get("publication_date")?.toString();
        const volume = formData.get("volume-no")?.toString();
        const issuedNo = formData.get("issued-no")?.toString();
        const department = formData.get("department")?.toString() || "Computer Science";
        const categoryName = formData.get("category")?.toString();
        const abstract = formData.get("abstract")?.toString() || "";
        const file = formData.get("file") as File;
        
        // Format publication date correctly for PostgreSQL
        // If it's a range like "2019-2020", extract the first year and format as YYYY-01-01
        if (publicationDate) {
            // Check if it's a year range (like "2019-2020" or "2019 - 2020")
            const yearRangeMatch = publicationDate.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
            if (yearRangeMatch) {
                // Store the first year as January 1st of that year
                const startYear = yearRangeMatch[1];
                publicationDate = `${startYear}-01-01`;
                console.log(`Converted publication date range '${publicationDate}' to formatted date: ${publicationDate}`);
            } else if (/^\d{4}$/.test(publicationDate)) {
                // It's just a year, format as YYYY-01-01
                publicationDate = `${publicationDate}-01-01`;
                console.log(`Converted publication year '${publicationDate}' to formatted date: ${publicationDate}`);
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)) {
                // If it's not already in YYYY-MM-DD format, set a default
                console.warn(`Publication date '${publicationDate}' is in an unrecognized format, using current year`);
                const currentYear = new Date().getFullYear();
                publicationDate = `${currentYear}-01-01`;
            }
        }
        
        // Log form data for debugging
        console.log("Form data received: ", {
            title, 
            publicationDate, 
            volume, 
            issuedNo, 
            categoryName,
            filePresent: !!file,
            fileName: file?.name,
            fileSize: file?.size
        });
        
        // Extract authors
        let authors: string[] = [];
        try {
            const authorData = formData.get("author")?.toString();
            if (authorData) authors = JSON.parse(authorData);
            console.log("Parsed authors:", authors);
        } catch (error) {
            console.error("Error parsing authors:", error);
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Invalid author data format" };
            return;
        }
        
        // Extract topics
        let topics: string[] = [];
        try {
            const topicsData = formData.get("topics")?.toString();
            if (topicsData) topics = JSON.parse(topicsData);
            console.log("Parsed topics:", topics);
        } catch (error) {
            console.error("Error parsing topics:", error);
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Invalid topics data format" };
            return;
        }
        
        console.log("Single Document Upload Details:");
        console.log("Title:", title);
        console.log("Publication Date:", publicationDate);
        console.log("Volume:", volume);
        console.log("Issued No:", issuedNo);
        console.log("Authors:", authors);
        console.log("Topics:", topics);
        console.log("File:", file ? `{ name: ${file.name}, size: ${file.size}, type: ${file.type} }` : "No file uploaded");
        
        // Validate required fields
        if (!title || !publicationDate || !volume || !categoryName || !file) {
            console.warn("Missing required fields in single document upload");
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Missing required fields: title, publication date, volume, category, and file are all required" };
            return;
        }
        
        // Wrap entire database operation in try-catch with detailed logging
        console.log("Starting database transaction");
        try {
            await client.queryObject("BEGIN");
            console.log("Database transaction started successfully");
        } catch (txError) {
            console.error("CRITICAL: Failed to start database transaction:", txError);
            ctx.response.status = 500;
            ctx.response.body = { 
                success: false, 
                message: "Database transaction error", 
                error: txError instanceof Error ? txError.message : String(txError)
            };
            return;
        }
        
        try {
            // Get category ID
            let categoryId = null;
            if (categoryName) {
                const categoryResult = await client.queryObject<{ id: number }>(
                    `SELECT id FROM categories WHERE category_name ILIKE $1`,
                    [categoryName]
                );
                if (categoryResult.rows.length > 0) {
                    categoryId = categoryResult.rows[0].id;
                    console.log(`Found category '${categoryName}' with ID ${categoryId}`);
                } else {
                    await client.queryObject("ROLLBACK");
                    console.error(`Category not found: ${categoryName}`);
                    ctx.response.status = 400;
                    ctx.response.body = { success: false, message: "Category not found" };
                    return;
                }
            }
            
            // Save the file - with more robust error handling
            console.log("Saving file:", file.name, "size:", file.size, "type:", file.type);
            let filePath = "";
            try {
                // Use absolute path for reliability
                const rootPath = Deno.cwd();
                console.log("Current working directory:", rootPath);
                
                const uploadDir = `${rootPath}/Deno/filepathpdf`;
                console.log("Using upload directory:", uploadDir);
                
                await ensureDir(uploadDir);
                console.log("Directory ensured:", uploadDir);
                
                // Check if the directory exists and is writable
                try {
                    const dirInfo = await Deno.stat(uploadDir);
                    console.log("Directory exists, stats:", JSON.stringify(dirInfo));
                    
                    // Test write access with a temporary file
                    const testFile = `${uploadDir}/test_write_${Date.now()}.tmp`;
                    await Deno.writeTextFile(testFile, "test");
                    await Deno.remove(testFile);
                    console.log("Directory is writable");
                } catch (dirError) {
                    console.error("CRITICAL: Upload directory error:", dirError);
                    throw new Error(`Upload directory issue: ${dirError.message}`);
                }
                
                // Create a safe filename - add timestamp to prevent overwrites
                const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                filePath = `${uploadDir}/${safeName}`;
                
                console.log("File buffer read starting...");
                let fileData;
                try {
                    fileData = new Uint8Array(await file.arrayBuffer());
                    console.log("File buffer read complete, size:", fileData.length);
                } catch (bufferError) {
                    console.error("File buffer read error:", bufferError);
                    throw new Error(`Failed to read file: ${bufferError.message}`);
                }
                
                try {
                    await Deno.writeFile(filePath, fileData);
                    console.log("File saved to:", filePath);
                } catch (writeError) {
                    console.error("File write error:", writeError);
                    throw new Error(`Failed to write file: ${writeError.message}`);
                }
            } catch (fileError) {
                console.error("File processing error:", fileError);
                await client.queryObject("ROLLBACK");
                ctx.response.status = 500;
                ctx.response.body = { 
                    success: false, 
                    message: "Failed to process uploaded file", 
                    error: fileError instanceof Error ? fileError.message : String(fileError)
                };
                return;
            }
            
            // Insert document
            console.log("Inserting document into database");
            console.log(`Using formatted publication date: ${publicationDate}`);
            const documentResult = await client.queryObject<{ id: number }>(
                `INSERT INTO documents 
                (title, publication_date, volume, issued_no, department, category_id, abstract, file)
                VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8) 
                RETURNING id`,
                [
                    title, 
                    publicationDate, // The ::date cast ensures PostgreSQL interprets this as a date type
                    volume,
                    issuedNo,
                    department, 
                    categoryId, 
                    abstract, 
                    filePath
                ]
            );
            
            const documentId = documentResult.rows[0].id;
            console.log("Document inserted with ID:", documentId);
            
            // Process authors
            console.log("Processing authors");
            for (const authorName of authors) {
                // Check if author exists
                let authorResult = await client.queryObject<{ author_id: string }>(
                    `SELECT author_id FROM authors WHERE full_name = $1`,
                    [authorName]
                );
                
                let authorId;
                if (authorResult.rows.length > 0) {
                    authorId = authorResult.rows[0].author_id;
                    console.log(`Using existing author: ${authorName} (ID: ${authorId})`);
                } else {
                    // Create new author
                    const newAuthorResult = await client.queryObject<{ author_id: string }>(
                        `INSERT INTO authors (full_name) VALUES ($1) RETURNING author_id`,
                        [authorName]
                    );
                    authorId = newAuthorResult.rows[0].author_id;
                    console.log(`Created new author: ${authorName} (ID: ${authorId})`);
                }
                
                // Create document-author relationship
                await client.queryObject(
                    `INSERT INTO document_authors (document_id, author_id) 
                    VALUES ($1, $2)
                    ON CONFLICT (document_id, author_id) DO NOTHING`,
                    [documentId, authorId]
                );
                console.log(`Linked document ${documentId} with author ${authorId}`);
            }
            
            // Process topics
            console.log("Processing topics");
            for (const topicName of topics) {
                // Check if topic exists
                let topicResult = await client.queryObject<{ id: number }>(
                    `SELECT id FROM topics WHERE topic_name = $1`,
                    [topicName]
                );
                
                let topicId;
                if (topicResult.rows.length > 0) {
                    topicId = topicResult.rows[0].id;
                    console.log(`Using existing topic: ${topicName} (ID: ${topicId})`);
                } else {
                    // Create new topic
                    const newTopicResult = await client.queryObject<{ id: number }>(
                        `INSERT INTO topics (topic_name) VALUES ($1) RETURNING id`,
                        [topicName]
                    );
                    topicId = newTopicResult.rows[0].id;
                    console.log(`Created new topic: ${topicName} (ID: ${topicId})`);
                }
                
                // Create document-topic relationship
                await client.queryObject(
                    `INSERT INTO document_topics (document_id, topic_id) 
                    VALUES ($1, $2)
                    ON CONFLICT (document_id, topic_id) DO NOTHING`,
                    [documentId, topicId]
                );
                console.log(`Linked document ${documentId} with topic ${topicId}`);
            }
            
            // Commit transaction
            await client.queryObject("COMMIT");
            console.log("Transaction committed successfully");
            
            ctx.response.body = { 
                success: true, 
                message: "Document uploaded successfully",
                documentId: documentId 
            };
            
        } catch (error) {
            // Rollback transaction on error
            await client.queryObject("ROLLBACK");
            console.error("Error during transaction, rolled back:", error);
            throw error;
        }
        
    } catch (error) {
        console.error("Error in single document upload:", error);
        
        // Try to get a more detailed error message
        let errorDetails = "Unknown error";
        if (error instanceof Error) {
            errorDetails = `${error.name}: ${error.message}`;
            if (error.stack) {
                console.error("Error stack:", error.stack);
            }
        } else {
            errorDetails = String(error);
        }
        
        // Ensure we return a proper response
        try {
            ctx.response.status = 500;
            ctx.response.body = { 
                success: false,
                message: "Error uploading document", 
                error: errorDetails
            };
            console.log("Error response sent to client");
        } catch (responseError) {
            console.error("Failed to send error response:", responseError);
        }
    }
}