import { client } from "../data/denopost_conn.ts";
import { Request } from "https://deno.land/x/oak@v17.1.4/request.ts";

interface DocumentRow {
    id: number;
    title: string;
    publication_date: string;
    file: string;
    volume: string;
    abstract: string;
    category_name: string;
    author_names: string[];
    topics: Array<{ topic_name: string; topic_id: number; }>;
}

// Fetch categories
export const fetchCategories = async () => {
    try {
        const result = await client.queryObject(`
            SELECT 
                c.id, 
                c.category_name,
                COUNT(d.id) as file_count
            FROM categories c
            LEFT JOIN documents d ON c.id = d.category_id
            GROUP BY c.id, c.category_name
        `);
        return new Response(JSON.stringify(result.rows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("🔥 ERROR in fetchCategories:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch categories" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// Fetch documents with category names
export const fetchDocuments = async (req: Request): Promise<Response> => {
    try {
        console.log("Fetching documents from database");
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        const volume = url.searchParams.get('volume');
        const page = parseInt(url.searchParams.get('page') || '1');
        const size = parseInt(url.searchParams.get('size') || '5');
        const offset = (page - 1) * size;
        
        let query = `
            SELECT 
                d.id,
                d.title,
                d.publication_date,
                d.file,
                d.volume,
                d.abstract,
                c.category_name,
                COALESCE(array_agg(DISTINCT a.full_name) FILTER (WHERE a.full_name IS NOT NULL), ARRAY[]::text[]) as author_names,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'topic_name', t.topic_name,
                            'topic_id', t.id
                        )
                    ) FILTER (WHERE t.topic_name IS NOT NULL),
                    '[]'::json
                ) as topics,
                COUNT(*) OVER() as total_count
            FROM documents d
            LEFT JOIN categories c ON d.category_id = c.id
            LEFT JOIN document_authors da ON d.id = da.document_id
            LEFT JOIN authors a ON da.author_id = a.author_id
            LEFT JOIN document_topics dt ON d.id = dt.document_id
            LEFT JOIN topics t ON dt.topic_id = t.id
        `;

        // Add WHERE clause for category filter
        const whereClause = [];
        const params = [];
        let paramIndex = 1;

        if (category && category !== "All") {
            whereClause.push(`LOWER(c.category_name) = LOWER($${paramIndex})`);
            params.push(category);
            paramIndex++;
        }

        // Add volume filter if provided
        if (volume) {
            whereClause.push(`d.volume = $${paramIndex}`);
            params.push(volume);
            paramIndex++;
        }

        if (whereClause.length > 0) {
            query += ` WHERE ${whereClause.join(' AND ')}`;
        }

        // Get sort order from query parameters
        const sortOrder = url.searchParams.get('sort') || 'latest';
        const sortDirection = sortOrder === 'latest' ? 'DESC' : 'ASC';

        query += ` GROUP BY d.id, d.title, d.publication_date, d.file, d.volume, d.abstract, c.category_name
                  ORDER BY d.publication_date ${sortDirection}
                  LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

        params.push(size, offset);

        console.log("Executing query:", query);
        console.log("Query parameters:", params);

        const result = await client.queryObject<DocumentRow & { total_count: number }>(query, params);
        
        // Transform the result to ensure topics are properly formatted
        const documents = result.rows.map((doc) => ({
            id: doc.id,
            title: doc.title,
            publication_date: doc.publication_date,
            file: doc.file,
            volume: doc.volume,
            abstract: doc.abstract,
            category_name: doc.category_name,
            author_names: Array.isArray(doc.author_names) ? doc.author_names : [],
            topics: Array.isArray(doc.topics) ? doc.topics : []
        }));

        // Convert BigInt total_count to number
        const totalCount = Number(result.rows[0]?.total_count || 0);

        return new Response(JSON.stringify({
            documents,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / size)
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error fetching documents:", error instanceof Error ? error.message : String(error));
        return new Response(JSON.stringify({ 
            message: "Error fetching documents", 
            error: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
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
        const volumes = result.rows.map((row: { volume: string }) => row.volume);
        
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
