/**
 * Fetches all categories and their document counts
 * @returns Array of categories with counts
 */
export async function getAllCategories(): Promise<CategoryWithCount[]> {
  try {
    console.log("Fetching all categories with counts by document_type");
    
    // Get the count of documents by document_type
    const query = `
      SELECT 
        document_type as name, 
        COUNT(*) as count
      FROM 
        documents 
      WHERE 
        is_deleted = false
      GROUP BY 
        document_type
      ORDER BY 
        document_type
    `;
    
    console.log("Executing query:", query);
    const result = await client.queryObject(query);
    
    if (!result.rows || result.rows.length === 0) {
      console.log("No categories found");
      return [];
    }
    
    console.log(`Found ${result.rows.length} categories with document counts`);
    
    // Map the results to our interface
    const categories = result.rows.map((row: any) => ({
      name: row.name || '',
      count: parseInt(row.count, 10) || 0
    }));
    
    console.log("Categories with counts:", categories);
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
} 