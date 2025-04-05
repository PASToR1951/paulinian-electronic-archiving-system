import { client } from "../data/denopost_conn.ts";

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
        
        let query = `
            SELECT 
                d.id,
                d.title,
                d.publication_date,
                d.file,
                d.volume,
                c.category_name,
                COALESCE(array_agg(DISTINCT a.full_name) FILTER (WHERE a.full_name IS NOT NULL), ARRAY[]::text[]) as author_names,
                COALESCE(array_agg(DISTINCT t.topic_name) FILTER (WHERE t.topic_name IS NOT NULL), ARRAY[]::text[]) as topics
            FROM documents d
            LEFT JOIN categories c ON d.category_id = c.id
            LEFT JOIN Authors a ON a.author_id = ANY(d.author_ids)
            LEFT JOIN document_topics dt ON d.id = dt.document_id
            LEFT JOIN topics t ON t.id = dt.topic_id
        `;

        // Add WHERE clause for category filter
        let whereClause = [];
        let params = [];
        let paramIndex = 1;

        if (category && category !== "All") {
            whereClause.push(`LOWER(c.category_name) = LOWER($${paramIndex}) AND c.category_name IS NOT NULL`);
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

        query += ` GROUP BY d.id, d.title, d.publication_date, d.file, d.volume, c.category_name
                  ORDER BY d.publication_date DESC`;

        console.log("Executing query:", query);
        console.log("Category filter:", category);
        console.log("Volume filter:", volume);

        const result = params.length > 0
            ? await client.queryObject(query, params)
            : await client.queryObject(query);

        // Convert BigInt values and format dates
        const processedRows = result.rows.map((row: any) => ({
            id: Number(row.id),
            title: row.title,
            publication_date: row.publication_date ? new Date(row.publication_date).toISOString().split('T')[0] : null,
            file: row.file,
            volume: row.volume,
            category_name: row.category_name,
            author_names: Array.isArray(row.author_names) ? row.author_names : [],
            topics: Array.isArray(row.topics) ? row.topics : []
        }));

        console.log(`Found ${processedRows.length} documents${category && category !== "All" ? ` for category ${category}` : ''}${volume ? ` and volume ${volume}` : ''}`);
        return new Response(JSON.stringify(processedRows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch documents" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
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
        const volumes = result.rows.map((row: any) => row.volume);
        
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
