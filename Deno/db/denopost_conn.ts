import { pool } from "../config/db.ts";

// Export a client for direct DB operations
export const client = {
  async queryArray(text: string, params: any[] = []) {
    const connection = await pool.connect();
    try {
      return await connection.queryArray(text, params);
    } finally {
      connection.release();
    }
  },
  
  async queryObject(text: string, params: any[] = []) {
    const connection = await pool.connect();
    try {
      return await connection.queryObject(text, params);
    } finally {
      connection.release();
    }
  }
};

/**
 * Connects to the PostgreSQL database and confirms connection
 * @returns {Promise<void>}
 */
export async function connectToDb(): Promise<void> {
  try {
    // Try to get a client from the pool
    const client = await pool.connect();
    console.log("Database connection established successfully");
    client.release();
    return Promise.resolve();
  } catch (error) {
    console.error("Database connection error:", error);
    console.log("Continuing with limited functionality...");
    // We resolve instead of reject to allow the server to start even without DB
    return Promise.resolve();
  }
}
