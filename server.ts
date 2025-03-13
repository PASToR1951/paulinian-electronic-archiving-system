import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { serveFile } from "https://deno.land/std@0.218.2/http/file_server.ts";
import { handleLoginRequest } from "./routes/login.ts";
import { client } from "./data/denopost_conn.ts";

const env = await load({ envPath: "./.env" });
console.log("Loaded Environment Variables:", env);

const PORT = 8000;

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/login" && req.method === "POST") {
    return await handleLoginRequest(req);
  }

  // ✅ Serve files from `public/` and `admin/`
  if (req.method === "GET") {
    try {
      let filePath = url.pathname;

      // ✅ Correct file paths for both `public/` and `admin/`
      if (filePath === "/") {
        filePath = "/public/index.html"; 
      } else if (filePath.startsWith("/admin/")) {
        filePath = filePath.replace("/admin", "/admin"); // ✅ Serves `admin/`
      } else {
        filePath = `/public${filePath}`; // ✅ Serves `public/`
      }

      return await serveFile(req, `${Deno.cwd()}${filePath}`);
    } catch {
      return new Response("File not found", { status: 404 });
    }
  }

  return new Response("Not Found", { status: 404 });
}

async function startServer() {
  console.log("Attempting to connect to the database...");
  try {
    await client.connect();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    Deno.exit(1);
  }

  console.log(`Server running on http://localhost:${PORT}`);
  serve(handler, { port: PORT });
}

startServer();
