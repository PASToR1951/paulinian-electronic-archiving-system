import { fetchCategories } from "../controllers/documentController.ts";

export async function handler(req: Request): Promise<Response> {
    if (req.method === "GET") {
        return await fetchCategories();
    } else {
        return new Response("Method Not Allowed", { status: 405 });
    }
}
