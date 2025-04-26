import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { client } from "../data/denopost_conn.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

// Alternate implementation of exists check since existsSync import may not be available
const existsSync = async (path: string): Promise<boolean> => {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
};

// Ensure Deno namespace is available
declare const Deno: any;

/**
 * Handles compiled document upload submissions (multiple documents in one)
 */
export async function handleCompiledDocumentUpload(ctx: Context, formData: FormData): Promise<void> {
    console.log("Processing compiled document upload");
    
    try {
        // Extract compiled document metadata
        const startYearString = formData.get("compiled-start-year")?.toString();
        const endYearString = formData.get("compiled-end-year")?.toString();
        const volume = formData.get("compiled-volume")?.toString();
        const issuedNo = formData.get("compiled-issued-no")?.toString();
        const categoryName = formData.get("compiled-category")?.toString();
        
        // Parse years as integers for the database
        let startYear: number | null = null;
        let endYear: number | null = null;
        
        if (startYearString) {
            if (/^\d{4}$/.test(startYearString)) {
                startYear = parseInt(startYearString, 10);
                console.log(`Parsed start year: ${startYear}`);
            } else {
                console.warn(`Start year '${startYearString}' is not in the expected format`);
            }
        }
        
        if (endYearString) {
            if (/^\d{4}$/.test(endYearString)) {
                endYear = parseInt(endYearString, 10);
                console.log(`Parsed end year: ${endYear}`);
            } else {
                console.warn(`End year '${endYearString}' is not in the expected format`);
            }
        }
        
        // If no end year provided but start year exists, use start year as end year
        if (startYear && !endYear) {
            endYear = startYear;
            console.log(`Using start year as end year: ${endYear}`);
        }
        
        console.log("Compiled Document Upload Details:");
        console.log("Start Year:", startYear);
        console.log("End Year:", endYear);
        console.log("Volume:", volume);
        console.log("Issued No:", issuedNo);
        console.log("Category:", categoryName);
        
        // Validate required fields
        if (!startYear || !endYear || !volume || !issuedNo || !categoryName) {
            console.warn("Missing required fields in compiled document upload");
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Missing required fields for compiled document" };
            return;
        }
        
        // Begin transaction
        await client.queryObject("BEGIN");
        
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
            
            // Create new compiled document record
            console.log("Creating compiled document record");
            
            // Log the exact SQL query we're about to execute
            const compiledDocSQL = `INSERT INTO compiled_documents 
                (start_year, end_year, volume, issued_no, category_id) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING id`;
            
            console.log("Executing SQL:", compiledDocSQL);
            console.log("With parameters:", [startYear, endYear, volume, issuedNo, categoryId]);
            
            const compiledDocResult = await client.queryObject<{ id: number }>(
                compiledDocSQL,
                [
                    startYear,
                    endYear,
                    volume, 
                    issuedNo, 
                    categoryId
                ]
            );
            
            const compiledDocId = compiledDocResult.rows[0].id;
            console.log("Created compiled document with ID:", compiledDocId);
            
            // Process each document entry
            const docTitles = formData.getAll("doc_titles[]").map((entry: FormDataEntryValue) => entry.toString());
            const docFiles = formData.getAll("doc_files[]");
            
            // Get research agenda data
            const docAgendas: string[] = [];
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('doc_agenda_input[]')) {
                    docAgendas.push(value.toString());
                }
            }
            
            // Get author data - this is more complex as it needs to be grouped by document
            const docAuthors: Record<number, string[]> = {};
            for (const [key, value] of formData.entries()) {
                if (key.includes('author-data-')) {
                    // Extract the document index and author data
                    const match = key.match(/author-data-(\d+)/);
                    if (match) {
                        const index = parseInt(match[1]);
                        if (!docAuthors[index]) {
                            docAuthors[index] = [];
                        }
                        try {
                            const authors = JSON.parse(value.toString());
                            if (Array.isArray(authors)) {
                                docAuthors[index] = authors;
                            }
                        } catch (e) {
                            console.error(`Error parsing author data for document ${index}:`, e);
                        }
                    }
                }
            }
            
            console.log("Document titles:", docTitles);
            console.log("Document agendas:", docAgendas);
            console.log("Document authors:", docAuthors);
            console.log("Document files count:", docFiles.length);
            
            if (docTitles.length === 0 || docFiles.length === 0) {
                await client.queryObject("ROLLBACK");
                console.error("No documents provided in compiled document");
                ctx.response.status = 400;
                ctx.response.body = { success: false, message: "No documents provided in compiled document" };
                return;
            }
            
            // Process each document
            for (let i = 0; i < docTitles.length; i++) {
                try {
                    const title = docTitles[i];
                    const agenda = docAgendas[i] || '';
                    const file = docFiles[i] as File;
                    const authors = docAuthors[i+1] || []; // Assuming indexes start at 1
                
                if (!title || !file) {
                    console.log(`Skipping invalid entry at index ${i}: missing title or file`);
                    continue;  // Skip invalid entries
                }
                
                console.log(`Processing document ${i+1}/${docTitles.length}: "${title}"`);
                console.log(`File: ${file.name}, Authors: ${authors.join(', ')}`);
                
                // Save the file with improved error handling
                const uploadDir = "./Deno/filepathpdf";
                let filePath = "";
                try {
                    await ensureDir(uploadDir);
                    
                    // Check if directory exists and is writable
                    if (!await existsSync(uploadDir)) {
                        throw new Error(`Upload directory does not exist: ${uploadDir}`);
                    }
                    
                    // Create a safe filename with timestamp to prevent overwrites
                    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    filePath = `${uploadDir}/${safeName}`;
                    
                    console.log(`Reading file data for ${file.name}...`);
                    const fileData = new Uint8Array(await file.arrayBuffer());
                    console.log(`File data read complete, size: ${fileData.length} bytes`);
                    
                    await Deno.writeFile(filePath, fileData);
                    console.log(`Saved file to ${filePath}`);
                } catch (fileError) {
                    console.error(`Error saving file ${file.name}:`, fileError);
                    throw new Error(`Failed to save file ${file.name}: ${fileError.message}`);
                }
                
                // Insert document
                // Create a date string in YYYY-MM-DD format using the startYear
                const publicationDate = `${startYear}-01-01`;
                console.log(`Using publication date: ${publicationDate}`);
                const documentResult = await client.queryObject<{ id: number }>(
                    `INSERT INTO documents (title, publication_date, volume, issued_no, category_id, file, research_agenda, compiled_document_id)
                    VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8) 
                    RETURNING id`,
                    [
                        title,
                        publicationDate, // The ::date cast ensures PostgreSQL interprets this as a date type
                        volume,
                        issuedNo,
                        categoryId,
                        filePath,
                        agenda,
                        compiledDocId
                    ]
                );
                
                const documentId = documentResult.rows[0].id;
                console.log(`Created document ${i+1} with ID:`, documentId);
                
                // Process authors for this document
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
                
                // Add research agenda as a topic if provided
                if (agenda && agenda.trim()) {
                    // Check if topic exists
                    let topicResult = await client.queryObject<{ id: number }>(
                        `SELECT id FROM topics WHERE topic_name = $1`,
                        [agenda]
                    );
                    
                    let topicId;
                    if (topicResult.rows.length > 0) {
                        topicId = topicResult.rows[0].id;
                        console.log(`Using existing topic: ${agenda} (ID: ${topicId})`);
                    } else {
                        // Create new topic
                        const newTopicResult = await client.queryObject<{ id: number }>(
                            `INSERT INTO topics (topic_name) VALUES ($1) RETURNING id`,
                            [agenda]
                        );
                        topicId = newTopicResult.rows[0].id;
                        console.log(`Created new topic: ${agenda} (ID: ${topicId})`);
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
                } catch (documentError) {
                    console.error(`Error processing document at index ${i}:`, documentError);
                    throw new Error(`Failed to process document ${i+1}: ${documentError.message}`);
                }
            }
            
            // Commit transaction for compiled document
            await client.queryObject("COMMIT");
            console.log("Transaction committed successfully");
            
            ctx.response.body = { 
                success: true, 
                message: "Compiled document uploaded successfully",
                compiledDocId: compiledDocId
            };
            
        } catch (error) {
            // Rollback transaction on error
            await client.queryObject("ROLLBACK");
            console.error("Error during transaction, rolled back:", error);
            throw error;
        }
        
    } catch (error) {
        console.error("Error in compiled document upload:", error);
        
        // Get detailed error information
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
                message: "Error uploading compiled document", 
                error: errorDetails
            };
            console.log("Error response sent to client");
        } catch (responseError) {
            console.error("Failed to send error response:", responseError);
        }
    }
}