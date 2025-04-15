import { Application, Router, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const app = new Application();
const router = new Router();

// Root path
router.get("/", async (ctx) => {
  await send(ctx, "index.html", {
    root: `${Deno.cwd()}/public`,
  });
});

// Log-in page
router.get("/log-in.html", async (ctx) => {
  await send(ctx, "log-in.html", {
    root: `${Deno.cwd()}/public`,
  });
});

// Public files
router.get("/public/:path+", async (ctx) => {
  const path = ctx.params.path;
  if (!path) {
    ctx.response.status = 404;
    ctx.response.body = "Not Found";
    return;
  }
  await send(ctx, path, {
    root: `${Deno.cwd()}/public`,
  });
});

// Components
router.get("/components/:path+", async (ctx) => {
  const path = ctx.params.path;
  if (!path) {
    ctx.response.status = 404;
    ctx.response.body = "Not Found";
    return;
  }
  await send(ctx, path, {
    root: `${Deno.cwd()}/public/components`,
  });
});

// Static assets
router.get("/:path+", async (ctx) => {
  const path = ctx.params.path;
  if (!path) {
    ctx.response.status = 404;
    ctx.response.body = "Not Found";
    return;
  }
  if (path.endsWith(".css") || path.endsWith(".js") || path.endsWith(".png") || 
      path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".svg")) {
    await send(ctx, path, {
      root: `${Deno.cwd()}/public`,
    });
  } else {
    ctx.response.status = 404;
    ctx.response.body = "Not Found";
  }
});

// Admin files
router.get("/admin/:path+", async (ctx) => {
  const path = ctx.params.path;
  if (!path) {
    ctx.response.status = 404;
    ctx.response.body = "Not Found";
    return;
  }
  await send(ctx, path, {
    root: `${Deno.cwd()}/admin`,
  });
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Static file server running on http://localhost:8001");
await app.listen({ port: 8001 });
