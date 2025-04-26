import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { join } from "https://deno.land/std@0.218.2/path/mod.ts";

const ROOT_PATH = Deno.cwd();
const ENV_PATH = join(ROOT_PATH, ".env");

const _env = await load({ envPath: ENV_PATH });

console.log("Attempting to connect to the database...");

// Create a client instance with more resilient connection options
const client = new Client({
    hostname: _env.PGHOST,
    user: _env.PGUSER,
    password: _env.PGPASSWORD,
    database: _env.PGDATABASE,
    port: parseInt(_env.PGPORT || "5432"),
    connection: {
        attempts: 5,
        interval: 1000,
    },
    reconnect: true, // Enable automatic reconnection
});

// Helper function to ensure the client is connected
async function ensureConnection() {
    try {
        // Try a simple query to test connection
        await client.queryObject("SELECT 1");
    } catch (error) {
        console.error("Database connection failed, reconnecting...", error);
        try {
            await client.connect();
        } catch (reconnectError) {
            console.error("Database reconnection failed:", reconnectError);
            throw reconnectError;
        }
    }
}

// Initial connection
try {
    await client.connect();
    console.log("Database connected successfully.");
} catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
}

export { client, ensureConnection };
