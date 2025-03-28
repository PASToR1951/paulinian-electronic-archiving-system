import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
import { serveDir } from "https://deno.land/std@0.218.2/http/file_server.ts";

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Serve root `/` with `/public/index.html`
    if (url.pathname === "/") {
        try {
            const file = await Deno.readFile("./public/index.html");
            return new Response(file, { status: 200, headers: { "Content-Type": "text/html" } });
        } catch (error) {
            console.error(" Error serving index.html:", error);
            return new Response("Error loading homepage", { status: 500 });
        }
    }

    // Serve /log-in.html directly
    if (url.pathname === "/log-in.html") {
        try {
            const file = await Deno.readFile("./public/log-in.html");
            return new Response(file, { status: 200, headers: { "Content-Type": "text/html" } });
        } catch (error) {
            console.error("Error serving log-in.html:", error);
            return new Response("Error loading login page", { status: 500 });
        }
    }

    // Serve /public files (including other static files)
    if (url.pathname.startsWith("/public/")) {
        return serveDir(req, { fsRoot: "./public", showDirListing: false });
    }

    // Serve /components files correctly from /public/components
    if (url.pathname.startsWith("/components/")) {
        return serveDir(req, { fsRoot: "./public", showDirListing: false });
    }

    // Serve other static assets like CSS, JS, and images
    if (url.pathname.startsWith("/css/") || url.pathname.startsWith("/js/") || url.pathname.startsWith("/images/")) {
        return serveDir(req, { fsRoot: "./public", showDirListing: false });
    }

    // Serve admin files from /admin
    if (url.pathname.startsWith("/admin/")) {
        return serveDir(req, { fsRoot: "./admin", showDirListing: false });
    }

    console.log(` 404 Not Found: ${url.pathname}`);
    return new Response("Not Found", { status: 404 });
}

console.log("Static File Server running on http://localhost:8080");
await serve(handler, { port: 8080 });
