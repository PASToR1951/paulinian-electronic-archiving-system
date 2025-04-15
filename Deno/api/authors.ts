import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { searchAuthors } from "../controllers/author-Controller.ts";

const router = new Router();

router.get("/api/authors", async (ctx) => {
    try {
        const response = await searchAuthors(ctx.request);
        ctx.response.body = await response.json();
        ctx.response.status = response.status;
        ctx.response.headers = response.headers;
    } catch (error) {
        console.error("Error in authors route:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
    }
});

export default router;
