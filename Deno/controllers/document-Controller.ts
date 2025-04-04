import { client } from "../data/denopost_conn.ts";

// Fetch categories
export const fetchCategories = async () => {
    try {
        const result = await client.queryObject(`
            SELECT id, category_name FROM categories
        `);
        return result.rows;
    } catch (error) {
        console.error("🔥 ERROR in fetchCategories:", error);
        return [];
    }
};

// Fetch documents with category names
export const fetchDocuments = async (req: Request): Promise<Response> => {
    try {
        console.log("Fetching documents from database");
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        
        let query = `
            SELECT 
                d.id,
                d.title,
                d.publication_date,
                d.file,
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
        if (category && category !== "All") {
            query += ` WHERE LOWER(c.category_name) = LOWER($1) AND c.category_name IS NOT NULL`;
        }

        query += ` GROUP BY d.id, d.title, d.publication_date, d.file, c.category_name
                  ORDER BY d.publication_date DESC`;

        console.log("Executing query:", query);
        console.log("Category filter:", category);

        const result = category && category !== "All"
            ? await client.queryObject(query, [category])
            : await client.queryObject(query);

        // Convert BigInt values and format dates
        const processedRows = result.rows.map((row: any) => ({
            id: Number(row.id),
            title: row.title,
            publication_date: row.publication_date ? new Date(row.publication_date).toISOString().split('T')[0] : null,
            file: row.file,
            category_name: row.category_name,
            author_names: Array.isArray(row.author_names) ? row.author_names : [],
            topics: Array.isArray(row.topics) ? row.topics : []
        }));

        console.log(`Found ${processedRows.length} documents${category && category !== "All" ? ` for category ${category}` : ''}`);
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
