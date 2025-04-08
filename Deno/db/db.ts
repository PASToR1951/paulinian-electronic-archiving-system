import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables
const env = config();

// Create a connection pool
export const pool = new Pool({
  user: env.PGUSER || "postgres",
  password: env.PGPASSWORD || "postgres",
  database: env.PGDATABASE || "peas_db",
  hostname: env.PGHOST || "localhost",
  port: Number(env.PGPORT) || 5432,
}, 20); // Maximum number of connections

// Test the connection
try {
  const client = await pool.connect();
  console.log("Successfully connected to the database");
  client.release();
} catch (err) {
  console.error("Error connecting to the database:", err);
} 