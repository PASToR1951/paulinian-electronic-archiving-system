// server.ts
import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { join } from "https://deno.land/std@0.218.2/path/mod.ts";
import { authorRoutes } from "./routes/author.ts";
import { indexRoutes } from "./routes/index.ts";

await load({ export: true, envPath: join(Deno.cwd(), ".env") });

async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/authors")) {
        return await authorRoutes(request);
    }

    return await indexRoutes(request);
}

try {
    await serve(handleRequest, { port: 8000 });
    console.log("Server listening on http://localhost:8000/");
} catch (error) {
    console.error("Error starting server:", error);
}