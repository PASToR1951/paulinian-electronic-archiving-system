import { fetchDocuments } from "../controllers/document-Controller.ts";

export async function handleFetchDocuments(req: Request): Promise<Response> {
    if (req.method === "GET") {
        return await fetchDocuments(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
}
