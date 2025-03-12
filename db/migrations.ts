// db/migrations.ts
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import "https://deno.land/std@0.217.0/dotenv/load.ts";

// Database connection setup (you might have this in a separate db.ts file)
const DB_USER = Deno.env.get("DB_USER");
const DB_PASSWORD = Deno.env.get("DB_PASSWORD");
const DB_NAME = Deno.env.get("DB_NAME");
const DB_HOST = Deno.env.get("DB_HOST");
const DB_PORT = Deno.env.get("DB_PORT");

if (!DB_USER || !DB_PASSWORD || !DB_NAME || !DB_HOST || !DB_PORT) {
    console.error("Database environment variables are missing.");
    Deno.exit(1);
}

const client = new Client({
    user: DB_USER,
    database: DB_NAME,
    hostname: DB_HOST,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT),
});

async function runMigrations() {
    try {
        await client.connect();

        // Example migration: Create the 'authors' table
        await client.queryObject(`
            CREATE TABLE IF NOT EXISTS authors (
                id SERIAL PRIMARY KEY,
                firstname VARCHAR(255) NOT NULL,
                middlename VARCHAR(255),
                lastname VARCHAR(255) NOT NULL,
                authorpfp VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add more migration scripts here as needed
        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await client.end();
    }
}

export { runMigrations };