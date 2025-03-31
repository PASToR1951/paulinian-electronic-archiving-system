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
export const fetchDocuments = async () => {
    try {
        const result = await client.queryObject(`
            SELECT d.*, c.category_name
            FROM documents d
            JOIN categories c ON d.category_id = c.id
        `);
        return result.rows;
    } catch (error) {
        console.error("🔥 ERROR in fetchDocuments:", error);
        return [];
    }
};
