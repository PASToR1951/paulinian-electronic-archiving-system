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

// Connect to the database
export async function connectToDatabase() {
  connectionAttempts++;
  
  try {
    console.log("===================================");
    console.log("🔌 DATABASE CONNECTION ATTEMPT #" + connectionAttempts);
    console.log("===================================");
    console.log(`Connection details: ${Deno.env.get("PGHOST") || "localhost"}:${Deno.env.get("PGPORT") || "5432"}/${Deno.env.get("PGDATABASE") || "postgres"}`);
    console.log(`Username: ${Deno.env.get("PGUSER") || "postgres"}`);
    console.log(`Password: ${"*".repeat(Deno.env.get("PGPASSWORD")?.length || 0)} (${Deno.env.get("PGPASSWORD")?.length || 0} chars)`);
    
    // Try to connect
    await client.connect();
    
    // Test the connection with a simple query
    const result = await client.queryObject("SELECT 1 as connected");
    if (result && result.rows && result.rows.length > 0) {
      console.log("✅ Database connection successful!");
      
      // Reset connection attempts on success
      connectionAttempts = 0;
      isConnected = true;
      
      // Additional diagnostic - check if tables exist
      try {
        const tablesResult = await client.queryObject(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        
        console.log(`Database has ${tablesResult.rows.length} tables:`);
        tablesResult.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ${(row as any).table_name}`);
        });
        
        // Check specifically for documents table
        const docCountQuery = `SELECT COUNT(*) as doc_count FROM documents`;
        try {
          const docResult = await client.queryObject(docCountQuery);
          console.log(`Documents table has ${(docResult.rows[0] as any).doc_count} records`);
          
          // If there are documents, check for a sample
          if (parseInt((docResult.rows[0] as any).doc_count) > 0) {
            console.log("Fetching a sample document to verify data:");
            const sampleDocQuery = `SELECT id, title FROM documents LIMIT 1`;
            const sampleDoc = await client.queryObject(sampleDocQuery);
            if (sampleDoc.rows.length > 0) {
              console.log("Sample document:", sampleDoc.rows[0]);
            } else {
              console.warn("Strange: No sample document found despite count > 0");
            }
          } else {
            console.warn("⚠️ WARNING: The documents table is EMPTY. This could be the reason no documents appear.");
          }
        } catch (docError) {
          console.error("Error checking document count:", docError);
        }
        
      } catch (diagError) {
        console.error("Error during database diagnostics:", diagError);
      }
    } else {
      throw new Error("Connection test failed");
    }
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`Retrying connection (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      return connectToDatabase();
    } else {
      console.error(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Check database configuration.`);
      isConnected = false;
      throw error;
    }
  }
}

// Function to diagnose database issues
export async function diagnoseDatabaseIssues() {
  try {
    console.log("===================================");
    console.log("🔍 DATABASE DIAGNOSTICS");
    console.log("===================================");
    
    // Check if client is defined
    if (!client) {
      console.error("❌ Database client is not initialized");
      return;
    }
    
    // Test connection with a simple query
    console.log("Testing connection with a simple query...");
    const testResult = await client.queryObject("SELECT 1 as test");
    console.log("Connection test result:", testResult.rows);
    
    // Check tables
    console.log("Checking database tables...");
    const tablesResult = await client.queryObject(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`Database has ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row: any, index: number) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    // Check documents table
    try {
      const docCountQuery = `SELECT COUNT(*) as doc_count FROM documents`;
      const docResult = await client.queryObject(docCountQuery);
      const docCount = parseInt(String((docResult.rows[0] as any).doc_count));
      console.log(`Documents table has ${docCount} records`);
      
      // If documents exist, get a sample
      if (docCount > 0) {
        console.log("Fetching a sample document to verify data:");
        const sampleDocQuery = `SELECT id, title FROM documents LIMIT 1`;
        const sampleDoc = await client.queryObject(sampleDocQuery);
        if (sampleDoc.rows.length > 0) {
          console.log("Sample document:", sampleDoc.rows[0]);
        } else {
          console.warn("Strange: No sample document found despite count > 0");
        }
        
        // Check active documents
        const activeDocQuery = `SELECT COUNT(*) as active_count FROM documents WHERE deleted_at IS NULL`;
        const activeResult = await client.queryObject(activeDocQuery);
        const activeCount = parseInt(String((activeResult.rows[0] as any).active_count));
        console.log(`Active (not deleted) documents: ${activeCount}`);
        
        if (activeCount === 0) {
          console.warn("⚠️ WARNING: All documents are marked as deleted (deleted_at is not NULL)!");
        }
      } else {
        console.warn("⚠️ WARNING: The documents table is EMPTY. This could be the reason no documents appear.");
      }
    } catch (docError) {
      console.error("Error checking documents table:", docError);
    }
    
    // Check categories
    try {
      const catQuery = `SELECT * FROM categories`;
      const catResult = await client.queryObject(catQuery);
      console.log(`Categories table has ${catResult.rows.length} categories`);
      if (catResult.rows.length > 0) {
        console.log("Categories:", catResult.rows.map((row: any) => 
          `${row.id}: ${row.category_name}`).join(', '));
      } else {
        console.warn("⚠️ WARNING: No categories found. Documents require categories.");
      }
    } catch (catError) {
      console.error("Error checking categories table:", catError);
    }
    
    console.log("===================================");
    console.log("🔍 DIAGNOSTICS COMPLETE");
    console.log("===================================");
  } catch (error) {
    console.error("Error during database diagnostics:", error);
  }
}