import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts"; // Changed to load
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { join, dirname } from "https://deno.land/std@0.218.2/path/mod.ts";

const ROOT_PATH = dirname(dirname(Deno.mainModule));
const ENV_PATH = join(ROOT_PATH, ".env");

export async function createClient(): Promise<Client> {
    try {
        console.log("ENV_PATH:", ENV_PATH);
        const env = await load({ envPath: ENV_PATH }); // Changed to load

        const user = env.PGUSER;
        const database = env.PGDATABASE;
        const hostname = env.PGHOST;
        const password = env.PGPASSWORD;
        const portString = env.PGPORT;

        if (!user || !database || !hostname || !password) {
            throw new Error("Missing required PostgreSQL environment variables.");
        }

        const port = portString ? parseInt(portString) : 5432;

        const client = new Client({
            user,
            database,
            hostname,
            password,
            port,
        });

        await client.connect();
        return client;
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
}

export async function closeClient(client: Client): Promise<void> {
    try {
        await client.end();
    } catch (error) {
        console.error("Error closing client:", error);
    }
}