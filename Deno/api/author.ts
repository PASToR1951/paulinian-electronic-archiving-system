import { Router } from "../deps.ts";
import { 
  searchAuthors, 
  handleDeleteAuthor, 
  handleRestoreAuthor 
} from "../controllers/author-Controller.ts";
import { client } from "../db/denopost_conn.ts";

// Debug log to indicate this module is loaded
console.log("Author API module loaded");

const router = new Router();

// Add a simple test endpoint that doesn't require database access
router.get("/api/authors/test", async (ctx) => {
    console.log("API authors test endpoint hit");
    ctx.response.status = 200;
    ctx.response.body = {
        message: "Author API test endpoint is working",
        timestamp: new Date().toISOString()
    };
    ctx.response.headers.set("Content-Type", "application/json");
    console.log("API authors test response sent");
});

// Fix the route pattern by explicitly allowing the method override
// and ensuring it matches the client-side request
router.get("/api/authors/search", async (ctx) => {
    console.log("API authors search endpoint hit:", ctx.request.url.href);
    const url = new URL(ctx.request.url);
    const request = new Request(url.toString());
    const response = await searchAuthors(request);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
    console.log("API authors search response status:", response.status);
});

// General authors endpoint
router.get("/api/authors", async (ctx) => {
    console.log("API authors general endpoint hit");
    const url = new URL(ctx.request.url);
    const request = new Request(url.toString());
    const response = await searchAuthors(request);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

router.delete("/api/authors/:id", async (ctx) => {
    console.log(`API authors delete endpoint hit for ID: ${ctx.params.id}`);
    const id = ctx.params.id;
    const response = await handleDeleteAuthor(id);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

router.post("/api/authors/:id/restore", async (ctx) => {
    console.log(`API authors restore endpoint hit for ID: ${ctx.params.id}`);
    const id = ctx.params.id;
    const response = await handleRestoreAuthor(id);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

console.log("Author API routes registered:", ["/api/authors/test", "/api/authors/search", "/api/authors", "/api/authors/:id", "/api/authors/:id/restore"]);

/**
 * Handle searching for authors by name
 */
export async function handleSearchAuthors(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("q") || "";
    
    if (searchTerm.length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const authors = await AuthorModel.searchByName(searchTerm);
    
    return new Response(JSON.stringify(authors), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error searching authors:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export default router;
