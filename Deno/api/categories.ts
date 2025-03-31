import { fetchCategories } from "../controllers/document-Controller.ts";

export async function handler(req: Request): Promise<Response> {
    if (req.method === "GET") {
        return await fetchCategories();
    } else {
        return new Response("Method Not Allowed", { status: 405 });
    }
}
