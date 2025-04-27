import { client, ensureConnection } from "../data/denopost_conn.ts";
// Use Request and Response from standard library instead of Oak
type Request = { url: string };
type Response = globalThis.Response;

interface DocumentRow {
    id: number;
    title: string;
    publication_date: string;
    file: string;
    volume: string;
    issued_no: string;
    abstract: string;
    category_name: string;
    author_names: string[];
    topics: Array<{ topic_name: string; topic_id: number; }>;
    // Compiled document fields
    compiled_document_id?: number;
    is_compiled_parent?: boolean;
    child_documents?: DocumentRow[];
    start_year?: number;
    end_year?: number;
    compiled_volume?: string;
    compiled_issued_no?: string;
    // Additional fields from query
    compiled_start_year?: number;
    compiled_end_year?: number;
    is_compiled_document?: boolean;
    total_count?: number;
}

// Fetch categories
export const fetchCategories = async () => {
    try {
        console.log("Executing fetchCategories...");
        
        // Ensure database connection is established
        await ensureConnection();
        
        const query = `
            SELECT 
                c.id, 
                c.category_name as name,
                COUNT(d.id) as count
            FROM 
                categories c
            LEFT JOIN 
                documents d ON c.id = d.category_id
            GROUP BY 
                c.id, c.category_name
            ORDER BY 
                c.category_name
        `;
        
        console.log("Executing query:", query);
        const result = await client.queryObject(query);
        console.log("fetchCategories result:", result);
        
        // Convert any BigInt values to Number to avoid serialization errors
        const safeRows = (result.rows as Record<string, unknown>[]).map((row) => {
            const safeRow: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(row)) {
                if (typeof value === 'bigint') {
                    safeRow[key] = Number(value);
                } else {
                    safeRow[key] = value;
                }
            }
            return safeRow;
        });
        
        console.log("Returning categories result with", safeRows.length, "categories");
        return new Response(JSON.stringify(safeRows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("🔥 ERROR in fetchCategories:", error);
        if (error && typeof error === "object" && "stack" in error && "message" in error) {
            return new Response(JSON.stringify({ 
                error: "Failed to fetch categories",
                details: (error as { message: string }).message,
                stack: (error as { stack: string }).stack
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        } else {
            return new Response(JSON.stringify({ 
                error: "Failed to fetch categories",
                details: String(error),
                stack: ""
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }
};

// Fetch documents with category names
export const fetchDocuments = async (req: Request): Promise<Response> => {
    try {
        // Ensure database connection is established
        await ensureConnection();
        
        console.log("Fetching documents from database");
        
        // Get URL parameters from the request
        const url = new URL(req.url);
        const params = url.searchParams;
        const category = params.get('category');
        const volume = params.get('volume');
        const page = parseInt(params.get("page") || "1");
        const requestedSize = parseInt(params.get("size") || "5");
        const offset = (page - 1) * requestedSize;
        
        console.log(`Request params: page=${page}, size=${requestedSize}, category=${category || 'All'}, volume=${volume || 'Any'}`);
        
        // First, get a count of all documents (including compiled ones) to determine total pagination
        let countQuery = `
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN d.compiled_document_id IS NOT NULL THEN d.compiled_document_id 
                    ELSE d.id 
                END) as doc_count
            FROM documents d
            LEFT JOIN categories c ON d.category_id = c.id
        `;
        const countParams: any[] = [];
        const countWhereConditions: string[] = [];
        if (category && category !== 'All') {
            countWhereConditions.push("LOWER(c.category_name) = LOWER($" + (countParams.length + 1) + ")");
            countParams.push(category);
        }
        if (volume) {
            countWhereConditions.push("d.volume = $" + (countParams.length + 1));
            countParams.push(volume);
        }
        if (countWhereConditions.length > 0) {
            countQuery += " WHERE " + countWhereConditions.join(" AND ");
        }
        const countResult = await client.queryObject<{ doc_count: number }>(countQuery, countParams);
        const totalCount = countResult.rows.length > 0 ? Number(countResult.rows[0].doc_count) : 0;
        
        // Now execute the main query to get all matching documents (no LIMIT/OFFSET)
        let query = `
            SELECT 
                d.id,
                d.title,
                d.publication_date,
                d.file,
                d.volume,
                d.issued_no,
                d.abstract,
                c.category_name,
                d.compiled_document_id,
                cd.start_year AS compiled_start_year,
                cd.end_year AS compiled_end_year,
                cd.volume AS compiled_volume,
                cd.issued_no AS compiled_issued_no,
                CASE 
                    WHEN d.compiled_document_id IS NOT NULL THEN true 
                    ELSE false 
                END AS is_compiled_document,
                COALESCE(array_agg(DISTINCT a.full_name) FILTER (WHERE a.full_name IS NOT NULL), ARRAY[]::text[]) as author_names,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'topic_name', t.topic_name,
                            'topic_id', t.id
                        )
                    ) FILTER (WHERE t.topic_name IS NOT NULL),
                    '[]'::json
                ) as topics
            FROM documents d
            LEFT JOIN categories c ON d.category_id = c.id
            LEFT JOIN compiled_documents cd ON d.compiled_document_id = cd.id
            LEFT JOIN document_authors da ON d.id = da.document_id
            LEFT JOIN authors a ON da.author_id = a.author_id
            LEFT JOIN document_topics dt ON d.id = dt.document_id
            LEFT JOIN topics t ON dt.topic_id = t.id
        `;
        const queryParams: any[] = [];
        const whereConditions: string[] = [];
        if (category && category !== 'All') {
            whereConditions.push("LOWER(c.category_name) = LOWER($" + (queryParams.length + 1) + ")");
            queryParams.push(category);
        }
        if (volume) {
            whereConditions.push("d.volume = $" + (queryParams.length + 1));
            queryParams.push(volume);
        }
        let whereClauseFinal = "";
        if (whereConditions.length > 0) {
            whereClauseFinal = "WHERE " + whereConditions.join(" AND ");
        }
        const sort = params.get('sort') || 'latest';
        let orderByClause = "ORDER BY d.publication_date DESC";
        if (sort === 'earliest') {
            orderByClause = "ORDER BY d.publication_date ASC";
        } else if (sort === 'title') {
            orderByClause = "ORDER BY d.title ASC";
        }
        const groupByClause = `GROUP BY d.id, d.title, d.publication_date, d.file, d.volume, d.issued_no, d.abstract, c.category_name, d.compiled_document_id, cd.start_year, cd.end_year, cd.volume, cd.issued_no`;
        query += ` ${whereClauseFinal} ${groupByClause} ${orderByClause}`;
        const result = await client.queryObject<DocumentRow>(query, queryParams);
        // Convert any BigInt values to regular numbers to prevent JSON serialization errors
        const safeRows = result.rows.map((row: any) => {
            const safeRow: Record<string, any> = { ...row };
            for (const key in safeRow) {
                if (typeof safeRow[key] === 'bigint') {
                    safeRow[key] = Number(safeRow[key]);
                }
            }
            return safeRow;
        });
        // Group compiled documents and format the results
        const documentsMap = new Map();
        const compiledDocumentsMap = new Map();
        // First pass - identify compiled documents and create parent entries
        safeRows.forEach(doc => {
            if (doc.compiled_document_id && !compiledDocumentsMap.has(doc.compiled_document_id)) {
                const compiledTitle = `Compiled Volume ${doc.compiled_volume} (${doc.compiled_start_year}-${doc.compiled_end_year})`;
                compiledDocumentsMap.set(doc.compiled_document_id, {
                    id: `compiled-${doc.compiled_document_id}`,
                    compiled_document_id: doc.compiled_document_id,
                    title: compiledTitle,
                    is_compiled_parent: true,
                    publication_date: `${doc.compiled_start_year}-${doc.compiled_end_year}`,
                    start_year: doc.compiled_start_year,
                    end_year: doc.compiled_end_year,
                    volume: doc.compiled_volume,
                    issued_no: doc.compiled_issued_no,
                    category_name: doc.category_name,
                    child_documents: [],
                    author_names: [],
                    topics: []
                });
            }
        });
        // Second pass - process all documents
        safeRows.forEach(doc => {
            const formattedDoc = {
                id: doc.id,
                title: doc.title,
                publication_date: doc.publication_date,
                file: doc.file,
                volume: doc.volume,
                issued_no: doc.issued_no,
                abstract: doc.abstract,
                category_name: doc.category_name,
                compiled_document_id: doc.compiled_document_id,
                is_compiled_document: doc.is_compiled_document,
                author_names: Array.isArray(doc.author_names) ? doc.author_names : [],
                topics: Array.isArray(doc.topics) ? doc.topics : []
            };
            documentsMap.set(doc.id, formattedDoc);
            if (doc.compiled_document_id && compiledDocumentsMap.has(doc.compiled_document_id)) {
                const parent = compiledDocumentsMap.get(doc.compiled_document_id);
                parent.child_documents.push(formattedDoc);
                if (Array.isArray(formattedDoc.author_names)) {
                    formattedDoc.author_names.forEach(author => {
                        if (author && !parent.author_names.includes(author)) {
                            parent.author_names.push(author);
                        }
                    });
                }
            }
        });
        // Combine both regular documents and compiled document parents
        let topLevelEntries: any[] = [];
        // Add regular (non-compiled) documents
        documentsMap.forEach(doc => {
            if (!doc.compiled_document_id) {
                topLevelEntries.push(doc);
            }
        });
        // Add compiled document parent entries
        compiledDocumentsMap.forEach(compiledDoc => {
            topLevelEntries.push(compiledDoc);
        });
        // Sort top-level entries as needed (by publication_date DESC by default)
        topLevelEntries.sort((a, b) => {
            if (sort === 'earliest') {
                return new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime();
            } else if (sort === 'title') {
                return (a.title || '').localeCompare(b.title || '');
            } else {
                return new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime();
            }
        });
        
        // Use the actual number of top-level entries for pagination calculations
        // This is more accurate than the SQL count when dealing with compiled documents
        const actualTotalCount = topLevelEntries.length;
        const totalPages = Math.ceil(Number(actualTotalCount) / Number(requestedSize));
        
        console.log(`Pagination calculation: actualTotalCount=${actualTotalCount}, topLevelEntries.length=${topLevelEntries.length}, requestedSize=${requestedSize}, totalPages=${totalPages}`);
        
        // Paginate after grouping
        const pagedEntries = topLevelEntries.slice(offset, offset + requestedSize);
        
        console.log(`Page ${page}: returning ${pagedEntries.length} documents, offset=${offset}, limit=${requestedSize}, from total ${topLevelEntries.length} entries`);
        
        // For debugging: if no documents were found for this page but we have entries in total, log extra info
        if (pagedEntries.length === 0 && topLevelEntries.length > 0) {
            console.log(`WARNING: No documents found for page ${page} despite having ${topLevelEntries.length} total documents`);
            console.log(`Page calculation: offset=${offset}, limit=${requestedSize}, start index=${offset}, end index=${offset + requestedSize}`);
            
            // Debug info about available document IDs
            const availableIds = topLevelEntries.map(doc => doc.id);
            console.log(`Available document IDs: ${availableIds.join(', ')}`);
            
            // If we have documents but they're not in the requested page range, return the first page instead
            if (page > 1 && topLevelEntries.length > 0) {
                console.log(`Returning first page documents instead of empty page ${page}`);
                return new Response(JSON.stringify({
                    documents: topLevelEntries.slice(0, requestedSize),
                    totalCount: actualTotalCount,
                    totalPages,
                    currentPage: 1,
                    pageRedirected: true // Signal the client we've redirected
                }), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }
        
        return new Response(JSON.stringify({
            documents: pagedEntries,
            totalCount: actualTotalCount,
            totalPages,
            currentPage: page
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (error: unknown) {
        let errMsg = "";
        if (error instanceof Error) {
            errMsg = error.message;
        } else if (typeof error === "string") {
            errMsg = error;
        } else {
            errMsg = JSON.stringify(error);
        }
        console.error("Error in fetchDocuments:", errMsg);
        return new Response(
            JSON.stringify({ 
                message: "Error fetching documents", 
                error: errMsg
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }
};

// Fetch volumes for a specific category
export const fetchVolumesByCategory = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        
        if (!category || category === "All") {
            return new Response(JSON.stringify({ error: "Category parameter is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        const query = `
            SELECT DISTINCT d.volume
            FROM documents d
            JOIN categories c ON d.category_id = c.id
            WHERE LOWER(c.category_name) = LOWER($1)
            AND d.volume IS NOT NULL
            AND d.volume != ''
            ORDER BY d.volume
        `;
        
        const result = await client.queryObject(query, [category]);
        
        // Extract volumes from result
        const volumes = result.rows.map(row => (row as { volume: string }).volume);
        
        return new Response(JSON.stringify(volumes), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching volumes:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch volumes" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
