import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { searchTopics, createTopic } from "../controllers/topic-Controller.ts";  

const router = new Router();

router.get("/api/topics", async (ctx) => {
    const url = new URL(ctx.request.url);
    const request = new Request(url.toString());
    const response = await searchTopics(request);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

router.post("/api/topics", async (ctx) => {
    const bodyValue = ctx.request.body();
    let body;
    if (bodyValue.type === "json") {
        body = await bodyValue.value;
    } else {
        ctx.response.status = 400;
        ctx.response.body = { error: "Expected JSON body" };
        return;
    }
    
    const requestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };
    const request = new Request(ctx.request.url.toString(), requestInit);
    const response = await createTopic(request);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

export default router;
