// db/migrations.ts
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import "https://deno.land/std@0.217.0/dotenv/load.ts";

// Database connection setup
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

        // Create or update the authors table
        await client.queryObject(`
            CREATE TABLE IF NOT EXISTS authors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                email VARCHAR(255),
                affiliation VARCHAR(255),
                year_of_graduation INTEGER,
                linkedin VARCHAR(255),
                bio TEXT,
                orcid_id VARCHAR(255),
                profile_picture VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Add any missing columns if they don't exist
            DO $$ 
            BEGIN 
                -- Add department if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'department') THEN
                    ALTER TABLE authors ADD COLUMN department VARCHAR(255);
                END IF;

                -- Add email if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'email') THEN
                    ALTER TABLE authors ADD COLUMN email VARCHAR(255);
                END IF;

                -- Add affiliation if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'affiliation') THEN
                    ALTER TABLE authors ADD COLUMN affiliation VARCHAR(255);
                END IF;

                -- Add year_of_graduation if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'year_of_graduation') THEN
                    ALTER TABLE authors ADD COLUMN year_of_graduation INTEGER;
                END IF;

                -- Add linkedin if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'linkedin') THEN
                    ALTER TABLE authors ADD COLUMN linkedin VARCHAR(255);
                END IF;

                -- Add bio if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'bio') THEN
                    ALTER TABLE authors ADD COLUMN bio TEXT;
                END IF;

                -- Add orcid_id if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'orcid_id') THEN
                    ALTER TABLE authors ADD COLUMN orcid_id VARCHAR(255);
                END IF;

                -- Add profile_picture if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'profile_picture') THEN
                    ALTER TABLE authors ADD COLUMN profile_picture VARCHAR(255);
                END IF;

                -- Add updated_at if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'updated_at') THEN
                    ALTER TABLE authors ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                END IF;
            END $$;
        `);

        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await client.end();
    }
}

// Run migrations
if (import.meta.main) {
    runMigrations();
}