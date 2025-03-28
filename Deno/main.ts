// denosrc/main.ts (or your main server file)
import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
// Import other modules as needed (e.g., your controllers)
import { addAuthor } from "./controllers/authors.ts"; // If you have an author controller

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Example: Handle the root path
  if (pathname === "/") {
    try {
      const html = await Deno.readTextFile("./index.html");
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      console.error("Error reading HTML:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // Example: Handle the /admin/add-author route (GET and POST)
  if (pathname === "/admin/add-author") {
    if (request.method === "GET") {
      try {
        const file = await Deno.readTextFile("./admin/components/add_author.html");
        return new Response(file, {
          headers: { "Content-Type": "text/html" },
        });
      } catch (error) {
        console.error("Error reading HTML file:", error);
        return new Response("File not found", { status: 404 });
      }
    } else if (request.method === "POST") {
      return addAuthor(request); // Call your controller function
    }
  }

  // ... other routes

  // Default: Return "Not Found" for unhandled routes
  return new Response("Not Found", { status: 404 });
}