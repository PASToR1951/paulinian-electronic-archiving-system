// denosrc/routes/authors.ts
import { addAuthor } from "../controllers/author.ts";

export async function authorRoutes(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/authors") {
        return await addAuthor(request);
    }

    return new Response("Not Found", { status: 404 });
}