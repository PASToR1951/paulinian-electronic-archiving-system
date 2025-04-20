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
                author_id uuid DEFAULT gen_random_uuid() NOT NULL,
                full_name character varying(255) NOT NULL,
                affiliation character varying(255),
                department character varying(255),
                year_of_graduation integer,
                email character varying(255),
                linkedin character varying(255),
                orcid_id character varying(255),
                biography text,
                profile_picture character varying(255),
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                deleted_at timestamp without time zone,
                gender character varying(1),
                CONSTRAINT authors_gender_check CHECK (((gender)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying])::text[])))
            );

            -- Add any missing columns if they don't exist
            DO $$ 
            BEGIN 
                -- Add deleted_at if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'authors' AND column_name = 'deleted_at') THEN
                    ALTER TABLE authors ADD COLUMN deleted_at timestamp without time zone;
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