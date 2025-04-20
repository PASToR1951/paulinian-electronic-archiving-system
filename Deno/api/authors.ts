import { Router } from "https://deno.land/x/oak/mod.ts";
import { searchAuthors } from "../controllers/author-Controller.ts";
import { handleDeleteAuthor, handleRestoreAuthor } from "../routes/authors.ts";

const router = new Router();
router.get("/api/authors", async (ctx) => {
    const response = await searchAuthors(ctx.request);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

router.delete("/api/authors/:id", async (ctx) => {
    const id = ctx.params.id;
    const response = await handleDeleteAuthor(id);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

router.post("/api/authors/:id/restore", async (ctx) => {
    const id = ctx.params.id;
    const response = await handleRestoreAuthor(id);
    ctx.response.status = response.status;
    ctx.response.body = response.body;
    ctx.response.headers = response.headers;
});

export default router;
