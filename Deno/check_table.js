import { client } from "./data/denopost_conn.ts";

async function checkTable() {
  try {
    // Get table structure
    const result = await client.queryObject(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'authors'
    `);
    
    console.log("Authors table structure:");
    console.log(result.rows);
    
    // Get a sample row
    const sampleResult = await client.queryObject(`
      SELECT * FROM authors LIMIT 1
    `);
    
    console.log("\nSample author row:");
    console.log(sampleResult.rows);
    
    await client.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkTable(); 