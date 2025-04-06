import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { join } from "https://deno.land/std@0.218.2/path/mod.ts";


const ROOT_PATH = Deno.cwd();
const ENV_PATH = join(ROOT_PATH, ".env");

const _env = await load({ envPath: ENV_PATH });

console.log("Attempting to connect to the database...");

const client = new Client({
    hostname: _env.PGHOST,
    user: _env.PGUSER,
    password: _env.PGPASSWORD,
    database: _env.PGDATABASE,
    port: parseInt(_env.PGPORT || "5432"),
    connection: {
        attempts: 3,
        interval: 1000,
    },
});

try {
    await client.connect();
    console.log("Database connected successfully.");
} catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
}

export { client }; 
