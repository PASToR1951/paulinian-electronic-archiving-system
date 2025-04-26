import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { 
  searchAuthors, 
  handleDeleteAuthor, 
  handleRestoreAuthor 
} from "../controllers/author-Controller.ts";

const router = new Router();
router.get("/api/authors", async (ctx) => {
    const url = new URL(ctx.request.url);
    const request = new Request(url.toString());
    const response = await searchAuthors(request);
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
