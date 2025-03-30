import { searchTopics, createTopic } from "../controllers/topic-Controller.ts";

export async function topicRouter(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/api/topics") {
        return searchTopics(req);
    } else if (req.method === "POST" && url.pathname === "/api/topics") {
        return createTopic(req);
    }

    return new Response("Not Found", { status: 404 });
}
