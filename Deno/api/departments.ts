import { client } from "../db/denopost_conn.ts";
import { Context } from "../deps.ts";

interface Department {
  id: number | bigint;
  department_name: string;
  code: string;
}

/**
 * Get all departments
 */
export async function getDepartments(ctx: Context) {
  try {
    const result = await client.queryObject(
      "SELECT id, department_name, code FROM departments ORDER BY department_name"
    );
    
    // Process the data to handle BigInt values before serialization
    const processedRows = result.rows.map(row => {
      // Create a new object with all properties from the original row
      const processed = {...row as unknown as Department};
      
      // Convert any BigInt values to regular numbers
      if (typeof processed.id === 'bigint') {
        processed.id = Number(processed.id);
      }
      
      return processed;
    });
    
    ctx.response.body = processedRows;
    ctx.response.status = 200;
    ctx.response.type = "json";
  } catch (error: unknown) {
    console.error("Error fetching departments:", error);
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
    ctx.response.status = 500;
    ctx.response.type = "json";
  }
} 