import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const adminRouter = new Router();

// Admin dashboard route
adminRouter.get("/admin", async (ctx) => {
  await ctx.send({
    root: `${Deno.cwd()}/admin`,
    index: "index.html",
  });
});

// Admin documents page route
adminRouter.get("/admin/documents", async (ctx) => {
  await ctx.send({
    root: `${Deno.cwd()}/admin/Components`,
    path: "documents_page.html",
  });
});

// Admin author list page route
adminRouter.get("/admin/authors", async (ctx) => {
  await ctx.send({
    root: `${Deno.cwd()}/admin/Components`,
    path: "author-list.html",
  });
});

// Serve static admin files
adminRouter.get("/admin/(.*)", async (ctx) => {
  await ctx.send({
    root: Deno.cwd(),
    index: "index.html",
  });
});

export default adminRouter; 