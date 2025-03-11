// denosrc/routes/index.ts
import { serveFile } from "https://deno.land/std@0.218.2/http/file_server.ts";
import { join } from "https://deno.land/std@0.218.2/path/mod.ts";

export async function indexRoutes(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
        try {
            return await serveFile(request, join(Deno.cwd(), "index.html"));
        } catch (e) {
            console.error("Error serving index.html:", e);
            return new Response("File Not Found", { status: 404 });
        }
    }

    // Serve static files (CSS, JS, images)
    if (url.pathname.startsWith("/css") || url.pathname.startsWith("/js") || url.pathname.startsWith("/images")) {
        try {
            return await serveFile(request, join(Deno.cwd(), "public", url.pathname));
        } catch (e) {
            console.error("Error serving static file:", e);
            return new Response("File Not Found", { status: 404 });
        }
    }

    return new Response("Not Found", { status: 404 });
}