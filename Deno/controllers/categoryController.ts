import { Context } from "https://deno.land/x/oak/mod.ts";
import { client } from "../db/denopost_conn.ts";

// Interface for a category with a document count
interface CategoryWithCount {
  name: string;
  count: number;
}

/**
 * Get all categories with document counts
 */
export async function getCategories(ctx: Context) {
  try {
    console.log("Getting categories with document counts");
    
    // Query to get document counts by document_type
    const query = `
      SELECT 
        document_type as name, 
        COUNT(*) as count
      FROM 
        documents d
      WHERE 
        deleted_at IS NULL
        -- Exclude compiled documents (parents) by checking if they exist in the compiled_documents table
        AND NOT EXISTS (
          SELECT 1 FROM compiled_documents cd
          WHERE cd.id = d.id
        )
      GROUP BY 
        document_type
      ORDER BY 
        document_type
    `;
    
    console.log("Executing query:", query);
    const result = await client.queryObject(query);
    console.log("Query result:", result);
    
    if (!result.rows || result.rows.length === 0) {
      console.log("No categories found");
      ctx.response.body = [];
      return;
    }
    
    // Map the results to our interface
    const categories: CategoryWithCount[] = result.rows.map((row: any) => {
      console.log("Processing row:", row);
      return {
        name: row.name || '',
        count: parseInt(String(row.count), 10) || 0
      };
    });
    
    console.log(`Found ${categories.length} categories:`, categories);
    ctx.response.body = categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch categories" };
  }
} 