import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { join } from "https://deno.land/std@0.218.2/path/mod.ts";

const ROOT_PATH = Deno.cwd();
const ENV_PATH = join(ROOT_PATH, ".env");

const _env = await load({ envPath: ENV_PATH });

const client = new Client({
    hostname: _env.PGHOST,
    user: _env.PGUSER,
    password: _env.PGPASSWORD,
    database: _env.PGDATABASE,
    port: parseInt(_env.PGPORT || "5432"),
});

await client.connect();

export { client }; // ✅ Export persistent client
