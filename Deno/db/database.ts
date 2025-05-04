import { client } from "./denopost_conn.ts";

/**
 * Database class that provides a simplified interface for database operations
 */
export class Database {
  /**
   * Execute a SQL query with parameters
   * @param query SQL query string
   * @param params Array of parameters for the query
   * @returns Query result
   */
  async query(query: string, params: any[] = []) {
    try {
      const result = await client.queryObject(query, params);
      return result.rows;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }
} 