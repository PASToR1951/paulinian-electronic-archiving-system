// test_dotenv.ts
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";

async function main() {
    try {
        const env = await load(); // Use load() without options for default .env
        console.log("Environment variables:", env);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();